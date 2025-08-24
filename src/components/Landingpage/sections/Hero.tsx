import React from "react";
import { motion } from "framer-motion";
import AnimatedGrid from "@/components/Landingpage/renders/AnimatedGrid.tsx";
import { Button } from "@/components/ui/elements/button.tsx";
import { ChevronRight } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export const Hero: React.FC = () => {
  // Redirect based on Better Auth session
  const handleGetStarted = async () => {
    const { data: session } = await authClient.getSession();
    window.location.href = session ? "/dashboard" : "/login";
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-black/80 z-10" />
      <AnimatedGrid />

      <section className="min-h-screen flex items-center justify-center relative z-20 pt-32 pb-48">
        <div className="container mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-white animate-title-gradient">
                Planwise
              </span>
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto text-gray-300">
              Streamline your team scheduling with our intuitive drag-and-drop interface
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="flex gap-4 justify-center mt-12">
            <Button onClick={handleGetStarted} className="inline-flex items-center">
              Get started
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </section>
  );
};
