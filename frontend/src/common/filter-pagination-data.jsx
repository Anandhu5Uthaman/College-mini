import axios from "axios";
import { createSafeUrl } from "./url-helper";

export const filterPaginationData = async ({ state = { results: [], page: 1, totalDocs: 0 }, data, page, countRoute, data_to_send = {}, user = undefined }) => {
    try {
        // Initialize state if it's the first page
        if (page === 1) {
            state = { results: [], page: 1, totalDocs: 0 };
        }

        // Validate and create URL for count endpoint
        const countUrl = createSafeUrl(import.meta.env.VITE_SERVER_DOMAIN, `/api${countRoute}`);
        if (!countUrl) {
            throw new Error('Invalid count URL construction');
        }

        // Get total count of documents
        const headers = {};
        if (user) {
            headers.Authorization = `Bearer ${user}`;
        }

        const { data: { totalDocs } } = await axios.post(countUrl.toString(), data_to_send, {
            headers,
            withCredentials: true
        });

        // Update state with new results
        return {
            results: page === 1 ? data : [...(state.results || []), ...(data || [])],
            page,
            totalDocs: totalDocs || 0
        };

    } catch (error) {
        console.error('Error in filterPaginationData:', error);
        // Return current state if there's an error, ensuring it has the correct structure
        return {
            results: state?.results || [],
            page: state?.page || 1,
            totalDocs: state?.totalDocs || 0
        };
    }
};