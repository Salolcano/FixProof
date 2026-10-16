import { Navbar } from "@/components/Navbar";
import { BountyBoard } from "@/components/BountyBoard";
import { Footer, Hero, HowItWorks, Payouts, Trust } from "@/components/Sections";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Payouts />
        <section className="block" id="app" style={{ paddingTop: 20 }}>
          <div className="wrap">
            <div className="sec-head">
              <h2>This is the actual app.</h2>
              <p className="lede">
                Connect a wallet on GenLayer Studio and every button below sends a real transaction to the FixProof contract.
              </p>
            </div>
            <BountyBoard />
          </div>
        </section>
        <Trust />
      </main>
      <Footer />
    </>
  );
}
