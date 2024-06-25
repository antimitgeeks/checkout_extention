import { json } from "@remix-run/node";
// import { useActionData } from "@remix-run/react";

export const loader = async ({ request }) => {

};

export const action = async ({ request }) => {
    const body = await request.json()
    const npoDetails = body?.npos
    if (npoDetails) {
        const fetch = (await import('node-fetch')).default;
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            redirect: "follow",
            body: JSON.stringify({ "npos": npoDetails }),
        };
        const response = await fetch(`http://192.168.1.64:8080/api/v1/npos/valid`, requestOptions);
        const result = await response.json();
        const npos = result?.result
        return json({ message: "Valid Npos.", npos });
    }
};