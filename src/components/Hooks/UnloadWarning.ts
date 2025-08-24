import { useEffect } from "react";

const UnloadWarning: React.FC = () => {
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "Bist du sicher, dass du die Seite verlassen möchtest?";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    return null;
};

export default UnloadWarning;
