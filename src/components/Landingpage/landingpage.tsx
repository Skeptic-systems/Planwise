import { Hero } from "./sections/Hero";
import { Footer } from "./sections/Footer";
import FloatingNav from "@/components/ui/navigation/FloatingNav";

const LandingPage: React.FC = () => {
    return (
        <div className="dark:bg-black bg-white relative overflow-hidden">
            <Hero />
            <Footer />
            <FloatingNav />
        </div>
    );
};

export default LandingPage;
