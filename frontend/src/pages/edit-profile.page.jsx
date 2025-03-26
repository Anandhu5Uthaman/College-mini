import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../App";
import axios from "axios";
import { profileDataStructure } from "./profile.page";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { Toaster, toast } from "react-hot-toast";
import InputBox from "../components/input.component";
import { uploadImage } from "../common/aws";
import { storeInSession } from "../common/session";

const EditProfile = () => {

    let { userAuth, userAuth: { access_token }, setUserAuth } = useContext(UserContext);

    let bioLimit = 150;

    let profileImgEle = useRef();
    let editProfileForm = useRef();

    const [ profile, setProfile ] = useState(profileDataStructure);
    const [ loading, setLoading ] = useState(true);
    const [ charactersLeft, setCharactersLeft ] = useState(bioLimit);
    const [ updatedProfileImg, setUpdatedProfileImg ] = useState(null);
    const [ uploadingImg, setUploadingImg ] = useState(false);

    let { personal_info: { fullname, username: profile_username, profile_img, email, bio }, social_links } = profile;

    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        email: '',
        bio: '',
        social_links: {
            youtube: '',
            instagram: '',
            facebook: '',
            twitter: '',
            github: '',
            website: ''
        }
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                fullname: profile.personal_info.fullname || '',
                username: profile.personal_info.username || '',
                email: profile.personal_info.email || '',
                bio: profile.personal_info.bio || '',
                social_links: profile.social_links || {
                    youtube: '',
                    instagram: '',
                    facebook: '',
                    twitter: '',
                    github: '',
                    website: ''
                }
            });
        }
    }, [profile]);

    useEffect(() => {
        if(access_token){
            console.log("Fetching user profile for editing");
            setLoading(true);

            axios.get(`/api/profile`, {
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 10000 // 10-second timeout
            })
            .then(({ data }) => {
                console.log("Profile data received:", data);
                setProfile(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Profile fetch error details:", {
                    status: error.response?.status,
                    data: error.response?.data,
                    headers: error.response?.headers,
                    message: error.message,
                    config: error.config
                });

                if (error.response) {
                    switch(error.response.status) {
                        case 401:
                            toast.error('Please sign in again');
                            break;
                        case 404:
                            toast.error('Profile not found');
                            break;
                        case 500:
                            toast.error('Server error. Please try again later');
                            break;
                        default:
                            toast.error('An unexpected error occurred');
                    }
                } else if (error.request) {
                    toast.error('No response from server. Check your network connection');
                } else {
                    toast.error('Error setting up the request');
                }
                
                setLoading(false);
            });
        }
    }, [access_token])

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            // Handle social links
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            // Handle regular inputs
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleCharacterChange = (e) => {
        setCharactersLeft(bioLimit - e.target.value.length)
    }

    const handleImagePreview = (e) => {
        let img = e.target.files[0];
        
        if (!img) return;
        
        profileImgEle.current.src = URL.createObjectURL(img);
        setUpdatedProfileImg(img);
    }

    const handleImageUpload = async (e) => {
        let img = e.target.files[0];
        
        if (!img) return;
        
        try {
            setUploadingImg(true);
            
            const formData = new FormData();
            formData.append('profile_image', img); // Match the field name expected by the server
            
            const { data } = await axios.post("/api/upload-image", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (data.imageUrl) {
                // Update the profile image state
                setProfileImg(data.imageUrl);
                toast.success('Profile image updated successfully');
            }
        } catch (error) {
            console.error('Image upload error:', error);
            toast.error(error.response?.data?.error || 'Failed to upload image');
        } finally {
            setUploadingImg(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Show loading toast
            const loadingToast = toast.loading("Updating profile...");

            const response = await axios.put('/api/profile', formData, {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Dismiss loading toast
            toast.dismiss(loadingToast);

            if (response.data) {
                toast.success("Profile updated successfully");
                
                // Update local user data
                let newUserAuth = { ...userAuth, personal_info: { ...userAuth.personal_info, ...formData }};
                storeInSession("user", JSON.stringify(newUserAuth));
                setUserAuth(newUserAuth);
            }
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error(error.response?.data?.error || 'Failed to update profile');
        }
    }

    return (
        <AnimationWrapper>
            {
                loading ? <Loader /> :
                <form ref={editProfileForm}>
                    <Toaster />

                    <h1 className="max-md:hidden">Edit Profile</h1>

                    <div className="flex flex-col lg:flex-row items-start py-10 gap-8 lg:gap-10">

                        <div className="max-lg:center mb-5">
                            <label htmlFor="uploadImg" id="profileImgLable" className="relative block w-48 h-48 bg-grey rounded-full overflow-hidden">
                                <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-white bg-black/30 opacity-0 hover:opacity-100 cursor-pointer">
                                    Upload Image
                                </div>
                                <img ref={profileImgEle} src={profile_img} alt="Profile" />
                            </label>

                            <input 
                                type="file" 
                                id="uploadImg" 
                                accept=".jpeg, .png, .jpg" 
                                hidden 
                                onChange={handleImagePreview}
                            />

                            <button 
                                className="btn-light mt-5 max-lg:center lg:w-full px-10" 
                                onClick={handleImageUpload}
                                disabled={uploadingImg}
                                type="button"
                            >
                                {uploadingImg ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>

                        <div className="w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5">
                                <div>
                                    <InputBox 
                                        name="fullname" 
                                        type="text" 
                                        value={formData.fullname} 
                                        onChange={handleInputChange}
                                        placeholder="Full Name" 
                                        icon="fi-rr-user"
                                    />
                                </div>
                                <div>
                                    <InputBox 
                                        name="email" 
                                        type="email" 
                                        value={formData.email} 
                                        onChange={handleInputChange}
                                        placeholder="Email" 
                                        icon="fi-rr-envelope"
                                        disabled={true}
                                    />
                                </div>
                            </div>

                            <InputBox 
                                type="text" 
                                name="username" 
                                value={formData.username} 
                                onChange={handleInputChange}
                                placeholder="Username" 
                                icon="fi-rr-at" 
                            />

                            <p className="text-dark-grey -mt-3">Username will be used to search user and will be visible to all users</p>

                            <textarea 
                                name="bio" 
                                maxLength={bioLimit} 
                                value={formData.bio}
                                onChange={(e) => {
                                    handleInputChange(e);
                                    handleCharacterChange(e);
                                }}
                                className="input-box h-64 lg:h-40 resize-none leading-7 mt-5 pl-5" 
                                placeholder="Bio"
                            ></textarea>

                            <p className="mt-1 text-dark-grey">{charactersLeft} characters left</p>

                            <p className="my-6 text-dark-grey">Add your social handles below</p>

                            <div className="md:grid md:grid-cols-2 gap-x-6">
                                {Object.keys(formData.social_links).map((key, i) => (
                                    <InputBox 
                                        key={i} 
                                        name={`social_links.${key}`} 
                                        type="text" 
                                        value={formData.social_links[key]} 
                                        onChange={handleInputChange}
                                        placeholder="https://" 
                                        icon={"fi " + (key != "website" ? "fi-brands-" + key : "fi-rr-globe")} 
                                    />
                                ))}
                            </div>

                            <button 
                                className="btn-dark w-auto px-10" 
                                type="submit" 
                                onClick={handleSubmit}
                            >
                                Update
                            </button>

                        </div>

                    </div>
                </form>
            }
        </AnimationWrapper>
    )
}

export default EditProfile;