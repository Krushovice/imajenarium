import { MainLayout } from "@/components/layout";
import { AmbientParticles } from "@/components/design-system";

export default function Home() {
  return (
    <MainLayout>
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden">
        <AmbientParticles count={30} />
        <div className="relative z-10 text-center px-4">
          <h1 className="font-heading text-5xl font-semibold text-gradient-amber md:text-7xl">
            Book Imaginarium
          </h1>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl max-w-xl mx-auto">
            Твой персональный литературный мир, построенный на эмоциях и атмосфере
          </p>
        </div>
      </section>
    </MainLayout>
  );
}
