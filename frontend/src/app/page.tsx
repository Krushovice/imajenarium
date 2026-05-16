"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout";
import { StarryBackground, BookConstellation } from "@/components/design-system";
import { staggerContainer, staggerItem } from "@/lib/animations";

export default function Home() {
  return (
    <>
      <StarryBackground />
      <MainLayout>
        <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="relative z-10 flex flex-col items-center text-center px-4 gap-6"
          >
            {/* Constellation above title */}
            <motion.div variants={staggerItem}>
              <BookConstellation />
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="font-heading font-semibold leading-tight tracking-wide pb-2"
              style={{ fontSize: "clamp(3rem, 8vw, 5.5rem)" }}
            >
              <span className="text-gradient-cream">Imaginarium</span>
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="text-base md:text-lg max-w-md mx-auto leading-relaxed text-[#B8956A] -mt-2"
            >
              Персональный литературный мир,<br className="hidden sm:block" />
              построенный на эмоциях и атмосфере
            </motion.p>

            <motion.div variants={staggerItem}>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-medium
                  bg-amber text-background hover:bg-amber-light transition-all duration-200
                  shadow-lg shadow-amber/20 hover:shadow-amber/35 hover:scale-105 active:scale-100"
              >
                <span>Начать погружение</span>
                <span className="text-base">✦</span>
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </MainLayout>
    </>
  );
}
