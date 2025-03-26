import { useContext, useEffect } from "react";
import { BlogContext } from "../pages/blog.page";
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

const BlogInteraction = () => {

    let { blog, blog: { _id, title, blog_id, activity, activity: { total_likes, total_comments }, author: { personal_info: { username: author_username } } }, setBlog, islikedByUser, setLikedByUser, setCommentsWrapper } = useContext(BlogContext);

    let { userAuth: { username, access_token } } = useContext(UserContext);

    useEffect(() => {
        if (access_token) {
            axios.get(`/api/blog/${_id}/liked`, {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            .then(({ data: { isLiked } }) => {
                setLikedByUser(Boolean(isLiked));
            })
            .catch(err => {
                console.error('Error checking if blog is liked:', err);
            });
        }
    }, []);

    const handleLike = () => {
        if (access_token) {
            setLikedByUser(prevVal => !prevVal);

            let newTotalLikes = islikedByUser ? total_likes - 1 : total_likes + 1;
            setBlog({
                ...blog,
                activity: {
                    ...activity,
                    total_likes: newTotalLikes
                }
            });

            axios.post(`/api/blog/${_id}/like`, {}, {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            .then(({ data }) => {
                console.log('Like status updated:', data);
            })
            .catch(err => {
                console.error('Error updating like status:', err);
                // Revert the optimistic update
                setLikedByUser(prevVal => !prevVal);
                setBlog({
                    ...blog,
                    activity: {
                        ...activity,
                        total_likes: total_likes
                    }
                });
                toast.error('Failed to update like status. Please try again.');
            });
        } else {
            toast.error('Please sign in to like this blog');
        }
    }

    return (
        <>
            <Toaster />
            <hr className="border-grey my-2" />

            <div className="flex gap-6 justify-between">
                <div className="flex gap-3 items-center">
                    <button
                        onClick={handleLike}
                        className={"w-10 h-10 rounded-full flex items-center justify-center " + (islikedByUser ? "bg-red/20 text-red" : "bg-grey/80")}>
                            <i className={"fi " + ( islikedByUser ? "fi-sr-heart" : "fi-rr-heart" )}></i>
                    </button>
                    <p className="text-xl text-dark-grey">{ total_likes }</p>
                    
                    <button
                        onClick={() => setCommentsWrapper(preVal => !preVal)}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80">
                            <i className="fi fi-rr-comment-dots"></i>
                    </button>
                    <p className="text-xl text-dark-grey">{ total_comments }</p>
                </div>

                <div className="flex gap-6 items-center">

                    {
                        username == author_username ?
                        <Link to={`/editor/${blog_id}`} className="underline hover:text-purple">Edit</Link> :
                        <Link to={`/user/${author_username}`} className="underline hover:text-purple">View Profile</Link>
                    }

                    <Link to={`https://twitter.com/intent/tweet?text=Read ${title}&url=${location.href}`}><i className="fi fi-brands-twitter text-xl hover:text-twitter"></i></Link>

                </div>
            </div>

            <hr className="border-grey my-2" />
        </>       
    )
}

export default BlogInteraction;