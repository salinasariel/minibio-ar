"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

const Terms = () => {
    const [terms, setTerms] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTerms = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch(`/public/paramPublic/TERMS/ES`);
            setTerms(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTerms();
    }, []);

    console.log(terms);

    return (
        <div>
            <h1>Terms</h1>

            {isLoading && <p>Cargando...</p>}
            {error && <p style={{ color: "red" }}>Error: {error}</p>}

            {terms && (
                <pre>{JSON.stringify(terms, null, 2)}</pre>
            )}
        </div>
    );
};

export default Terms;
