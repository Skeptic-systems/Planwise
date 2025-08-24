import { Button } from "@/components/ui/elements/button.tsx";
import { Link, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";

const FloatingNav: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-8 mx-auto inset-x-0 z-50 flex gap-2 p-3 bg-black/80 backdrop-blur-xs rounded-full border border-gray-700 shadow-xl w-fit"
    >
      <div className="flex gap-2">
        <img
          src="/whiteplanwise.svg"
          alt="logo"
          className="w-10 h-10 rounded-full"
        />
      </div>

      <div ref={buttonRef} className="relative">
        <div className="flex">
          <Button
            asChild
            className="rounded-full gap-2 bg-white text-black hover:bg-black hover:text-white ease-in-out duration-500"
          >
            <a href="/login">
              <Rocket className="w-4 h-4" />
              <span>Login</span>
            </a>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default FloatingNav;
