import { LandingNav } from "@/components/landing/landing-nav";
import { ScanDemo } from "@/components/landing/scan-demo";
import { Pipeline } from "@/components/landing/pipeline";
import { DigitizeScroll } from "@/components/landing/digitize-scroll";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <LandingNav />
      <main>
        <ScanDemo />
        <Pipeline />
        <DigitizeScroll />
      </main>
      <Footer />
    </>
  );
}
