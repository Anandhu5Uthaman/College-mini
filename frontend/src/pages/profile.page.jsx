import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { UserContext } from "../App";
import AboutUser from "../components/about.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import InPageNavigation from "../components/inpage-navigation.component";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import LoadMoreDataBtn from "../components/load-more.component";
import PageNotFound from "./404.page";
import { toast } from "react-hot-toast";

export const profileDataStructure = {
    personal_info: {
        fullname: "",
        username: "",
        profile_img: "",
        bio: "",
    },
    account_info: {
        total_posts: 0,
        total_reads: 0,
    },
    social_links: {},
    joinedAt: "",
    _id: null
}

const ProfilePage = () => {
    let { id: profileId } = useParams();

    let [profile, setProfile] = useState(profileDataStructure);
    let [loading, setLoading] = useState(true);
    let [blogs, setBlogs] = useState({ results: [], user_id: null });
    let [profileLoaded, setProfileLoaded] = useState("");

    let { 
        personal_info: { fullname, username: profile_username, profile_img, bio }, 
        account_info: { total_posts = 0, total_reads = 0 }, 
        social_links = {}, 
        joinedAt = "" 
    } = profile;

    let { userAuth: { username } } = useContext(UserContext);

    const fetchUserProfile = () => {
        setLoading(true);
        console.log("Fetching profile for:", profileId);

        axios.get(`/api/profile/${profileId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        })
        .then(({ data }) => {
            console.log("Profile data received:", data);
            if(data){
                // Ensure all required fields exist with defaults
                const processedData = {
                    ...profileDataStructure,
                    ...data,
                    personal_info: {
                        ...profileDataStructure.personal_info,
                        ...data.personal_info
                    },
                    account_info: {
                        total_posts: data.account_info?.total_posts || 0,
                        total_reads: data.account_info?.total_reads || 0
                    }
                };
                setProfile(processedData);
                
                if (data._id) {
                    getBlogs({ user_id: data._id });
                }
            }
            setProfileLoaded(profileId);
            setLoading(false);
        })
        .catch(error => {
            console.error("Profile fetch error details:", error);
            setProfile(profileDataStructure);
            
            if (error.response) {
                switch(error.response.status) {
                    case 404:
                        toast.error('Profile not found. Check the username.');
                        break;
                    case 403:
                        toast.error('You are not authorized to view this profile.');
                        break;
                    case 500:
                        toast.error('Server error. Please try again later.');
                        break;
                    default:
                        toast.error('An unexpected error occurred.');
                }
            } else if (error.request) {
                toast.error('No response from server. Check your network connection.');
            } else {
                toast.error('Error setting up the request: ' + error.message);
            }
            
            setLoading(false);
        });
    }

    const getBlogs = ({ page = 1, user_id }) => {
        if (!user_id) {
            console.error("No user_id provided for fetching blogs");
            setBlogs({ results: [], user_id: null });
            return;
        }

        axios.post(`/api/get-blogs`, {
            page,
            author: user_id,
            limit: 10,
            draft: false
        })
        .then(async ({ data }) => {
            try {
                let formatedData = {
                    results: [...blogs.results, ...data.blogs],
                    page: page,
                    totalPages: data.totalPages,
                    hasMore: page < data.totalPages
                };
                
                formatedData.user_id = user_id;
                setBlogs(formatedData);
            } catch (error) {
                console.error("Error formatting blog data:", error);
                setBlogs({ results: [], user_id });
            }
        })
        .catch(error => {
            console.error("Blog fetch error:", error);
            setBlogs({ results: [], user_id });
            
            if (error.response?.status === 404) {
                console.log("No blogs found for user");
            } else {
                toast.error("Failed to load blogs. Please try again later.");
            }
        });
    }

    useEffect(() => {
        if(profileId !== profileLoaded) {
            setBlogs({ results: [], user_id: null });
            resetState();
            fetchUserProfile();
        }
    }, [profileId]);

    const resetState = () => {
        setProfile(profileDataStructure);
        setLoading(true);
        setProfileLoaded("");
    }

    const getProfileImageUrl = (imageUrl) => {
        if (!imageUrl) return '/default-profile.png';
        
        // If it's already an absolute URL (e.g., from S3 or external source)
        if (imageUrl.startsWith('http')) {
            return imageUrl;
        }
        
        // If it's a relative path starting with /uploads
        if (imageUrl.startsWith('/uploads')) {
            return `${import.meta.env.VITE_SERVER_DOMAIN}${imageUrl}`;
        }
        
        // If it's just the filename, construct the full path
        if (!imageUrl.startsWith('/')) {
            return `${import.meta.env.VITE_SERVER_DOMAIN}/uploads/profile-images/${imageUrl}`;
        }
        
        // Fallback for any other case
        return `${import.meta.env.VITE_SERVER_DOMAIN}${imageUrl}`;
    };

    return (

        <AnimationWrapper>
            {
                loading ? <Loader /> :
                profile_username.length ?
                    <section className="h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap-12">
                    <div className="flex flex-col max-md:items-center gap-5 min-w-[250px] md:w-[50%] md:pl-8 md:border-l border-grey md:sticky md:top-[100px] md:py-10">
                        <img 
                            src={getProfileImageUrl(profile_img)} 
                            alt={fullname} 
                            className="w-48 h-48 bg-grey rounded-full md:w-32 md:h-32 profile-image"
                        />

                        <h1 className="text-2xl font-medium">@{profile_username}</h1>
                        <p className="text-xl capitalize h-6">{fullname}</p>

                        <p>{total_posts.toLocaleString()} Posts - {total_reads.toLocaleString()} Reads</p>

                        <div className="flex gap-4 mt-2">
                            {
                                profileId == username ?
                                <Link to="/settings/edit-profile" className="btn-light rounded-md">Edit Profile</Link>
                                : " "
                            }
                        </div>

                        <AboutUser className="max-md:hidden" bio={bio} social_links={social_links} joinedAt={joinedAt} />

                    </div>

                    <div className="max-md:mt-12 w-full">
                            
                        <InPageNavigation routes={[ "Posts Published" , "About"]} defaultHidden={["About"]}>

                        <>
                            {
                                blogs == null ? ( <Loader /> ) : (
                                blogs.results.length ? 
                                    blogs.results.map((blog, i) => {
                                        return ( <AnimationWrapper transition={{ duration: 1,delay: i*0.1 }} key={i}>
                                            <BlogPostCard content={blog} author={blog.author.personal_info} />
                                        </AnimationWrapper>
                                        );
                                    })
                                : <NoDataMessage message="No posts published"/>
                            )}
                            <LoadMoreDataBtn state={blogs} fetchDataFun={getBlogs} />
                        </>

                        <AboutUser bio={bio} social_links={social_links} joinedAt={joinedAt} />

                        </InPageNavigation>

                    </div>

                    </section>
                : <PageNotFound />
            }
        </AnimationWrapper>

    )
}

export default ProfilePage;