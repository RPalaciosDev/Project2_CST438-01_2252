import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore, { CHAT_API_URL } from 'services/auth';

const useConversations = () => {
    const { user } = useAuthStore();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(`${CHAT_API_URL}/api/conversation`, {
            headers: {
                'X-User-Id': user?.id || '',
            }
        })
        .then(response => {
            setConversations(response.data);
            console.log(response.data);
            return response.data;
        })
        .catch(error => {
            console.error(error)
            setError(error)
        });
        setLoading(false);
    }, []);

  // Get the username from the user API
//   useEffect(() => {
//     if (conversations.length > 0) {
//       const conversationId = conversations[0].id;
//       axios.get(`/api/users/${conversationId}`)
//         .then(response => setUsername(response.data.username));
//     }
//   }, [conversations]);

  return { conversations, loading, error };
};

export default useConversations;
