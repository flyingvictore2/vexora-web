import React from "react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                backgroundColor: "#0b0c10",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "20px"
            }}
        >
            <div style={{ width: "100%", maxWidth: "400px" }}>
                {children}
            </div>
        </div>
    );
}
