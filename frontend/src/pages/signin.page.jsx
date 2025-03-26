const handleSubmit = async (e) => {
    e.preventDefault();
    
    let form = new FormData(formElement);
    let formData = {};

    for (let [key, value] of form.entries()) {
        formData[key] = value;
    }

    try {
        const { data } = await axios.post(
            `${import.meta.env.VITE_SERVER_DOMAIN}/signin`, 
            formData
        );

        // Store user data in session
        storeInSession("user", JSON.stringify(data));
        
        // Update user context
        setUserAuth(data);
        
        // Redirect to home page
        navigate("/");
        
    } catch (error) {
        // Handle specific error messages
        const errorMessage = error.response?.data?.error || "Sign in failed";
        toast.error(errorMessage);
    }
}; 