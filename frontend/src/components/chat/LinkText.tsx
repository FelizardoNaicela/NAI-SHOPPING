import React from "react";

type Props = {
    text?: string | null;
};

const urlRegex =
    /(https?:\/\/[^\s]+)/gi;

export default function LinkText({
    text,
}: Props) {

    if (!text)
        return null;

    const parts =
        text.split(urlRegex);

    return (
        <>
            {parts.map((part, index) => {

                if (part.match(urlRegex)) {

                    return (

                        <a
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: "#1976d2",
                                textDecoration: "underline",
                                wordBreak: "break-all",
                            }}
                        >
                            {part}
                        </a>

                    );

                }

                return (
                    <React.Fragment key={index}>
                        {part}
                    </React.Fragment>
                );

            })}
        </>
    );
}