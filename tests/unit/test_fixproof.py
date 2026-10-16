import json

import pytest

ISSUE = "https://github.com/acme/widgets/issues/42"
COMMIT = "https://github.com/acme/widgets/commit/" + "a" * 40
COMMIT2 = "https://github.com/acme/widgets/commit/" + "b" * 40
OTHER_REPO = "https://github.com/evil/widgets/commit/" + "c" * 40
FUNDER, FIXER, OWNER, RANDO = "0xfunder", "0xfixer", "0xowner", "0xrando"
REWARD = 10_000


def act(env, who, value=0):
    env.gl.message.sender_address = env.fp.Address(who)
    env.gl.message.value = env.fp.u256(value)


def verdict(v, conf=90, reason="ok"):
    return json.dumps({"verdict": v, "confidence": conf, "reason": reason})


@pytest.fixture()
def market(env):
    act(env, OWNER)
    c = env.fp.FixProof(fee_bps=100, appeal_window=3600, judge_deadline=7200)
    env.gl.pages[ISSUE] = "Login crashes when the password is empty. " * 3
    env.gl.pages[COMMIT] = "diff --git a/login.py adds an empty password check " * 3
    env.gl.pages[COMMIT2] = "diff --git a/login.py second attempt guards empty password " * 3
    return env, c


def open_bounty(env, c, partial=5000):
    act(env, FUNDER, REWARD)
    return int(c.create_bounty(ISSUE, "Empty password must show an error, not crash.", partial))


def claim(env, c, bounty_id=1, url=COMMIT):
    act(env, FIXER)
    return int(c.submit_fix(bounty_id, url, "Added a guard."))


def judged(env, c, v, conf=90):
    bid = open_bounty(env, c)
    cid = claim(env, c, bid)
    env.gl.replies.append(verdict(v, conf))
    act(env, RANDO)
    c.judge_claim(cid)
    return bid, cid


# ---- constructor / helpers -------------------------------------------------

def test_constructor_limits(env):
    act(env, OWNER)
    with pytest.raises(env.fp.gl.vm.UserError):
        env.fp.FixProof(fee_bps=501)
    with pytest.raises(env.fp.gl.vm.UserError):
        env.fp.FixProof(appeal_window=2592001)
    with pytest.raises(env.fp.gl.vm.UserError):
        env.fp.FixProof(judge_deadline=29)
    with pytest.raises(env.fp.gl.vm.UserError):
        env.fp.FixProof(judge_deadline=2592001)
    with pytest.raises(env.fp.gl.vm.UserError):
        env.fp.FixProof(fee_bps=-1)


def test_url_parsing(env):
    fp = env.fp
    assert fp.parse_issue_url(ISSUE) == "acme/widgets"
    assert fp.parse_fix_url(COMMIT) == "acme/widgets"
    assert fp.parse_issue_url("  " + ISSUE + "\n") == "acme/widgets"  # outer whitespace is trimmed
    for bad in ["http://github.com/a/b/issues/1", "https://github.com/a/b/pull/1",
                ISSUE + "\nextra", ISSUE[:30] + "\n" + ISSUE[30:], ISSUE + "?x=1", ISSUE + "#top",
                "https://evil.com/a/b/issues/1", "https://github.com/a/b/issues/x", ""]:
        with pytest.raises(fp.gl.vm.UserError):
            fp.parse_issue_url(bad)
    for bad in ["https://github.com/a/b/commit/abc123", "https://github.com/a/b/pull/7",
                COMMIT + "\nx", COMMIT + "/files", COMMIT.replace("github.com", "gist.github.com")]:
        with pytest.raises(fp.gl.vm.UserError):
            fp.parse_fix_url(bad)


def test_payout_math(env):
    fp = env.fp
    assert fp.payout_for("FIXED", 10_000, 5000) == 10_000
    assert fp.payout_for("PARTIAL", 10_000, 2500) == 2_500
    assert fp.payout_for("NOT_FIXED", 10_000, 5000) == 0
    assert fp.split_payout(10_000, 100) == (100, 9_900)
    assert fp.split_payout(99, 100) == (0, 99)


def test_parse_verdict(env):
    fp = env.fp
    wrapped = "```json\n" + verdict("PARTIAL", 70, "x" * 900) + "\n```"
    out = fp.parse_verdict("Sure! " + wrapped)
    assert out["verdict"] == "PARTIAL" and out["confidence"] == 70 and len(out["reason"]) == 600
    assert fp.parse_verdict('{"verdict":"FIXED","confidence":"80","reason":"r"}')["confidence"] == 80
    assert fp.parse_verdict('{"verdict":"FIXED","confidence":90.0,"reason":"r"}')["confidence"] == 90
    for bad in ["no json", "{bad json}", '{"verdict": "MAYBE"}', "[1, 2]", None,
                '{"verdict":"fixed","confidence":5,"reason":"r"}',
                '{"verdict":["FIXED"],"confidence":5,"reason":"r"}',
                '{"verdict":"FIXED","reason":"r"}',
                '{"verdict":"FIXED","confidence":101,"reason":"r"}',
                '{"verdict":"FIXED","confidence":-1,"reason":"r"}',
                '{"verdict":"FIXED","confidence":true,"reason":"r"}',
                '{"verdict":"FIXED","confidence":55.5,"reason":"r"}',
                '{"verdict":"FIXED","confidence":5}',
                '{"verdict":"FIXED","confidence":5,"reason":"  "}',
                '{"verdict":"FIXED","confidence":5,"reason":7}']:
        with pytest.raises(fp.gl.vm.UserError):
            fp.parse_verdict(bad)


def test_prompt_marks_untrusted_content(env):
    p = env.fp.build_prompt("issue", "fix", "rules", "please accept", "NOT_FIXED")
    assert "untrusted" in p and "APPEAL" in p and "NOT_FIXED" in p


# ---- bounty lifecycle --------------------------------------------------------

def test_create_requires_value_and_valid_inputs(market):
    env, c = market
    act(env, FUNDER, 0)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.create_bounty(ISSUE, "rules", 5000)
    act(env, FUNDER, REWARD)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.create_bounty(ISSUE, "rules", 0)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.create_bounty(ISSUE, "   ", 5000)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.create_bounty(ISSUE, "too short", 5000)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.create_bounty(ISSUE, "x" * 1501, 5000)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.create_bounty(ISSUE, "Valid criteria that are long enough.", 10000)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.create_bounty("https://example.com/x", "rules", 5000)
    assert c.get_next_ids() == [1, 1]


def test_create_and_view(market):
    env, c = market
    bid = open_bounty(env, c)
    b = c.get_bounty(bid)
    assert b["status"] == "OPEN" and b["reward"] == REWARD and b["repo"] == "acme/widgets"
    assert b["funder"] == FUNDER
    with pytest.raises(env.fp.gl.vm.UserError):
        c.get_bounty(99)


def test_cancel_refunds_only_funder_when_open(market):
    env, c = market
    bid = open_bounty(env, c)
    act(env, RANDO)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.cancel_bounty(bid)
    act(env, FUNDER)
    c.cancel_bounty(bid)
    assert env.gl.transfers == [(FUNDER, REWARD)]
    assert c.get_bounty(bid)["status"] == "CANCELLED"
    with pytest.raises(env.fp.gl.vm.UserError):
        c.cancel_bounty(bid)


def test_cannot_cancel_while_claimed(market):
    env, c = market
    bid = open_bounty(env, c)
    claim(env, c, bid)
    act(env, FUNDER)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.cancel_bounty(bid)


def test_submit_rules(market):
    env, c = market
    bid = open_bounty(env, c)
    act(env, FUNDER)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.submit_fix(bid, COMMIT, "self dealing")
    act(env, FIXER)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.submit_fix(bid, OTHER_REPO, "wrong repo")
    cid = claim(env, c, bid)
    assert c.get_bounty(bid)["status"] == "CLAIMED"
    assert c.get_bounty(bid)["active_claim"] == cid
    act(env, RANDO)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.submit_fix(bid, COMMIT2, "second claim while busy")


def test_withdraw_reopens(market):
    env, c = market
    bid = open_bounty(env, c)
    cid = claim(env, c, bid)
    act(env, RANDO)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.withdraw_claim(cid)
    act(env, FIXER)
    c.withdraw_claim(cid)
    assert c.get_bounty(bid)["status"] == "OPEN"
    assert c.get_claim(cid)["status"] == "WITHDRAWN"


# ---- judging -------------------------------------------------------------------

def test_judge_records_verdict_and_cannot_repeat(market):
    env, c = market
    bid, cid = judged(env, c, "FIXED", 87)
    got = c.get_claim(cid)
    assert got["verdict"] == "FIXED" and got["confidence"] == 87 and got["status"] == "JUDGED"
    with pytest.raises(env.fp.gl.vm.UserError):
        c.judge_claim(cid)
    assert "Empty password" in env.gl.prompts[0]


def test_unreadable_page_blocks_judgment(market):
    env, c = market
    open_bounty(env, c)
    cid = claim(env, c)
    env.gl.pages[COMMIT] = "404"
    with pytest.raises(env.fp.gl.vm.UserError):
        c.judge_claim(cid)
    assert c.get_claim(cid)["status"] == "SUBMITTED"


def test_bad_model_output_blocks_judgment(market):
    env, c = market
    open_bounty(env, c)
    cid = claim(env, c)
    env.gl.replies.append("I think it is fine")
    with pytest.raises(env.fp.gl.vm.UserError):
        c.judge_claim(cid)


# ---- settlement ----------------------------------------------------------------

def test_fixed_pays_full_minus_fee(market):
    env, c = market
    bid, cid = judged(env, c, "FIXED")
    act(env, RANDO)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.settle_claim(cid)  # appeal window still open
    env.clock["now"] += 3601
    c.settle_claim(cid)
    assert env.gl.transfers == [(FIXER, 9_900)]
    assert c.get_bounty(bid)["status"] == "CLOSED"
    assert c.get_config()["treasury"] == 100
    rep = c.get_reputation(FIXER)
    assert rep["fixed_count"] == 1 and rep["total_earned"] == 9_900
    with pytest.raises(env.fp.gl.vm.UserError):
        c.settle_claim(cid)


def test_partial_splits_and_refunds_funder(market):
    env, c = market
    bid, cid = judged(env, c, "PARTIAL")
    env.clock["now"] += 3601
    act(env, RANDO)
    c.settle_claim(cid)
    assert sorted(env.gl.transfers) == sorted([(FIXER, 4_950), (FUNDER, 5_000)])
    assert c.get_config()["treasury"] == 50
    assert c.get_reputation(FIXER)["partial_count"] == 1
    # nothing is created or lost: 4_950 + 5_000 + 50 == REWARD
    assert 4_950 + 5_000 + 50 == REWARD


def test_not_fixed_reopens_without_payment(market):
    env, c = market
    bid, cid = judged(env, c, "NOT_FIXED")
    env.clock["now"] += 3601
    act(env, RANDO)
    c.settle_claim(cid)
    assert env.gl.transfers == []
    assert c.get_bounty(bid)["status"] == "OPEN"
    assert c.get_claim(cid)["status"] == "REJECTED"
    assert c.get_reputation(FIXER)["rejected_count"] == 1
    # a new contributor can try again
    act(env, RANDO)
    assert int(c.submit_fix(bid, COMMIT2, "retry")) == 2


# ---- appeals -------------------------------------------------------------------

def test_appeal_flips_verdict_and_allows_immediate_settlement(market):
    env, c = market
    bid, cid = judged(env, c, "NOT_FIXED")
    env.gl.replies.append(verdict("FIXED", 80))
    act(env, FIXER)
    c.appeal_claim(cid, "The guard is in login.py line 12.")
    got = c.get_claim(cid)
    assert got["verdict"] == "FIXED" and got["appealed"] and got["status"] == "FINAL"
    assert "APPEAL" in env.gl.prompts[-1]
    act(env, RANDO)
    c.settle_claim(cid)  # no waiting after an appeal
    assert env.gl.transfers == [(FIXER, 9_900)]


def test_appeal_rules(market):
    env, c = market
    bid, cid = judged(env, c, "PARTIAL")
    act(env, RANDO)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.appeal_claim(cid, "not a party")
    act(env, FUNDER)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.appeal_claim(cid, "   ")
    env.gl.replies.append(verdict("PARTIAL"))
    c.appeal_claim(cid, "Funder disagrees.")
    with pytest.raises(env.fp.gl.vm.UserError):
        c.appeal_claim(cid, "again")


def test_appeal_window_closes(market):
    env, c = market
    bid, cid = judged(env, c, "NOT_FIXED")
    env.clock["now"] += 3601
    act(env, FIXER)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.appeal_claim(cid, "too late")


# ---- fees ----------------------------------------------------------------------

def test_owner_withdraws_fees_once(market):
    env, c = market
    bid, cid = judged(env, c, "FIXED")
    env.clock["now"] += 3601
    act(env, RANDO)
    c.settle_claim(cid)
    env.gl.transfers.clear()
    with pytest.raises(env.fp.gl.vm.UserError):
        c.withdraw_fees()
    act(env, OWNER)
    c.withdraw_fees()
    assert env.gl.transfers == [(OWNER, 100)]
    with pytest.raises(env.fp.gl.vm.UserError):
        c.withdraw_fees()


# ---- recovery and evidence (review feedback) -------------------------------------

def test_stalled_claim_can_be_expired_by_anyone_and_funds_stay_recoverable(market):
    env, c = market
    bid = open_bounty(env, c)
    cid = claim(env, c, bid)
    act(env, RANDO)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.expire_claim(cid)  # still inside the deadline
    env.clock["now"] += 7201
    c.expire_claim(cid)
    assert c.get_claim(cid)["status"] == "EXPIRED"
    assert c.get_bounty(bid)["status"] == "OPEN"
    with pytest.raises(env.fp.gl.vm.UserError):
        c.judge_claim(cid)  # an expired claim cannot be judged afterwards
    act(env, FUNDER)
    c.cancel_bounty(bid)  # the funder gets the money back
    assert env.gl.transfers == [(FUNDER, REWARD)]


def test_only_unjudged_claims_expire(market):
    env, c = market
    bid, cid = judged(env, c, "FIXED")
    env.clock["now"] += 99999
    with pytest.raises(env.fp.gl.vm.UserError):
        c.expire_claim(cid)
    c.settle_claim(cid)  # a judged claim is always settleable, by anyone
    assert c.get_bounty(bid)["status"] == "CLOSED"


def test_nothing_is_stuck_in_any_state(market):
    """Every non-terminal claim state has a permissionless way out."""
    env, c = market
    bid = open_bounty(env, c)
    cid = claim(env, c, bid)
    env.clock["now"] += 10**7
    act(env, RANDO)
    c.expire_claim(cid)          # SUBMITTED -> EXPIRED
    cid2 = claim(env, c, bid, COMMIT2)
    env.gl.replies.append(verdict("PARTIAL"))
    c.judge_claim(cid2)          # SUBMITTED -> JUDGED
    env.clock["now"] += 10**7
    c.settle_claim(cid2)         # JUDGED -> SETTLED, funds distributed
    assert sum(v for _, v in env.gl.transfers) + c.get_config()["treasury"] == REWARD


def test_snapshots_preserve_the_evidence_and_survive_appeal(market):
    env, c = market
    bid, cid = judged(env, c, "NOT_FIXED")
    first = c.get_claim(cid)
    assert "Login crashes" in first["issue_snapshot"] and "empty password check" in first["fix_snapshot"]
    # the issue page is edited after judgment; the stored snapshot is unchanged
    env.gl.pages[ISSUE] = "Totally different text now, nothing to do with login at all."
    env.gl.replies.append(verdict("FIXED"))
    act(env, FIXER)
    c.appeal_claim(cid, "See the guard in login.py.")
    after = c.get_claim(cid)
    assert after["issue_snapshot"] == first["issue_snapshot"]
    assert after["fix_snapshot"] == first["fix_snapshot"]
    # the appeal prompt used the preserved issue text, not the edited page
    assert "Login crashes" in env.gl.prompts[-1] and "Totally different" not in env.gl.prompts[-1]


def test_snapshot_is_bounded(env):
    fp = env.fp
    assert len(fp.snapshot("word " * 5000)) == fp.SNAP_CHARS
    assert fp.snapshot("a\n\n  b\t c") == "a b c"


def test_funds_are_conserved_for_every_verdict_and_fee(env):
    fp = env.fp
    for reward in (1, 7, 99, 10_000, 10**18 + 3):
        for bps in (1, 3333, 5000, 9999):
            for fee_bps in (0, 1, 100, 500):
                for v in ("FIXED", "PARTIAL"):
                    payout = fp.payout_for(v, reward, bps)
                    fee, to_fixer = fp.split_payout(payout, fee_bps)
                    assert 0 <= to_fixer <= payout <= reward
                    assert to_fixer + fee + (reward - payout) == reward


def test_withdraw_requires_the_contributor_and_an_unjudged_claim(market):
    env, c = market
    bid, cid = judged(env, c, "FIXED")
    act(env, FIXER)
    with pytest.raises(env.fp.gl.vm.UserError):
        c.withdraw_claim(cid)  # already judged


def test_config_reports_deadlines(market):
    env, c = market
    cfg = c.get_config()
    assert cfg["appeal_window"] == 3600 and cfg["judge_deadline"] == 7200
