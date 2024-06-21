import { json } from "@remix-run/node";
// import { useState } from "react";
// Define the loader function
export const loader = async ({ request }) => {

    // const [data, setData] = useState('');
    let npos = [];
    const urlParams = new URLSearchParams(request.url.split('?')[1]);
    const customerId = urlParams.get('customerId');
    // Return a JSON response with a welcome message
    const fetch = (await import('node-fetch')).default;
    const myHeaders = new Headers();
    myHeaders.append("X-Shopify-Access-Token", process.env.ADMIN_TOKEN);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    try {
        const response = await fetch(`https://itgdev.myshopify.com/admin/api/2024-04/customers/${customerId}.json`, requestOptions);
        const result = await response.json();
        if (result?.customer) {
            const orderId = result.customer.last_order_id;
            if (orderId) {
                const response = await fetch(`https://itgdev.myshopify.com/admin/api/2024-01/orders/${orderId}/metafields.json`, requestOptions);
                const result = await response.json();
                const orderMetaFileds = result.metafields
                if (orderMetaFileds?.length) {
                    npos = orderMetaFileds.filter(item => item.namespace === 'custom' && item.key === 'ngo_data').map(item => item.value);
                }
            }
        }
    } catch (error) {
        console.error(error);
    }


    return json({ message: "Customer Npos Fetched.", npos });
};
