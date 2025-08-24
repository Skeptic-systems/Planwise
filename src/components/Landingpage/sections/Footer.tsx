import React from "react";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { motion } from "framer-motion";

export const Footer: React.FC = () => {
    return (
        <footer className="bg-black border-t border-gray-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src="/whiteplanwise.svg"
                            alt="Planwise"
                            className="h-8 w-auto"
                        />
                        <span className="text-2xl font-bold text-white">
                            Planwise
                        </span>
                    </div>
                    <p className="mt-4 text-gray-400 text-sm max-w-md">
                        Streamline your team scheduling with intuitive tools for efficient
                        assignment management and collaboration.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-12 pt-8 border-t border-gray-800"
                >
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-400 text-sm">
                            © {new Date().getFullYear()} Planwise. All rights reserved.
                        </p>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};
