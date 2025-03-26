import axios from "axios";
import AnimationWrapper from "../common/page-animation"
import InPageNavigation from "../components/inpage-navigation.component";
import { useEffect, useState } from "react";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";
import { activeTabRef } from "../components/inpage-navigation.component";
import NoDataMessage from "../components/nodata.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";
import { toast } from "react-hot-toast";
import { createSafeUrl } from "../common/url-helper";

const HomePage = () => {
    const [blogs, setBlog] = useState({ results: [], page: 1, totalDocs: 0 });
    const [trendingBlogs, setTrendingBlog] = useState([]);
    const [pageState, setPageState] = useState("home");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const categories = ["programming", "education", "announcement", "news", "entertainment", "food", "social media", "travel", "photography"];

    const fetchLatestBlogs = async ({ page = 1 }) => {
        try {
            setLoading(true);
            setError(null);
            
            // Create safe URL for the blogs endpoint
            const blogsUrl = createSafeUrl(import.meta.env.VITE_SERVER_DOMAIN, '/api/latest-blogs');
            if (!blogsUrl) {
                throw new Error('Invalid blogs URL construction');
            }

            // Fetch blogs data
            const { data } = await axios.post(blogsUrl.toString(), { page }, {
                withCredentials: true
            });

            // Update blogs state with pagination
            const newState = await filterPaginationData({
                state: blogs,
                data: data.blogs,
                page,
                countRoute: "/all-latest-blogs-count"
            });

            setBlog(newState);
        } catch (error) {
            console.error('Error fetching blogs:', error);
            setError('Failed to load blogs. Please try again.');
            toast.error('Failed to load blogs. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchBlogsByCategory = ({ page = 1 }) => {
        axios.post('/api/search-blogs', {
            tag: pageState,
            page,
            limit: 10
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        })
        .then( async ({ data }) => {
            let formatedData = await filterPaginationData({
                state: blogs,
                data: data.blogs,
                page,
                totalPages: data.totalPages,
                totalBlogs: data.totalBlogs
            });

            setBlog(formatedData);
        })
        .catch(err => {
            console.error('Error fetching blogs by category:', err);
            toast.error('Failed to load blogs. Please try again later.');
        });
    }

    const fetchTrendingBlogs = () => {
        axios.get('/api/trending-blogs', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        })
        .then(({ data }) => {
            setTrendingBlog(data);
        })
        .catch(err => {
            console.error('Error fetching trending blogs:', err);
            toast.error('Failed to load trending blogs. Please try again later.');
        });
    }

    const loadBlogByCategory = (e) => {
        
        let category = e.target.innerText.toLowerCase();

        setBlog(null);

        if(pageState == category){
            setPageState("home");
            return;
        }

        setPageState(category);

    }

    const handleLoadMore = () => {
        if (blogs && blogs.page) {
            fetchLatestBlogs({ page: blogs.page + 1 });
        }
    };

    useEffect(() => {

        activeTabRef.current.click();

        if(pageState == "home"){
            fetchLatestBlogs({page: 1});
        } else {
            fetchBlogsByCategory({page: 1});
        }

        if(!trendingBlogs){
            fetchTrendingBlogs();
        }
    }, [pageState])

    return (
        <AnimationWrapper>
            <section className="h-cover flex justify-center gap-10">
                {/* latest blogs */}
                <div className="w-full">

                    <InPageNavigation routes={[ pageState , "announcement"]} defaultHidden={["announcement"]}>

                        <>
                            {error ? (
                                <div className="text-center text-red-500 p-4">{error}</div>
                            ) : loading ? (
                                <Loader />
                            ) : blogs?.results?.length ? (
                                <>
                                    {blogs.results.map((blog, i) => (
                                        <AnimationWrapper key={blog._id} transition={{ duration: 1, delay: i * 0.1 }}>
                                            <BlogPostCard content={blog} author={blog.author.personal_info} />
                                        </AnimationWrapper>
                                    ))}
                                    {blogs.results.length < blogs.totalDocs && (
                                        <LoadMoreDataBtn handleLoadMore={handleLoadMore} />
                                    )}
                                </>
                            ) : (
                                <NoDataMessage message="No posts published" />
                            )}
                        </>

                        {
                                trendingBlogs == null ? <Loader /> :
                                trendingBlogs.length ?
                                    trendingBlogs.map((blog, i) => {
                                        return <AnimationWrapper transition={{ duration: 1,delay: i*0.1 }} key={i}>
                                            <MinimalBlogPost blog={blog} index={i} />
                                        </AnimationWrapper>
                                    })
                                : <NoDataMessage message="No trending Posts"/>
                        }
                        
                    </InPageNavigation>

                </div>

                {/* filters and trending blogs */}
                <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-1 border-grey pl-8 pt-3 max-md:hidden">
                    <div className="flex flex-col gap-10">
                        <div>
                            <h1 className="font-medium text-xl mb-8">Stories from all interests</h1>

                            <div className="flex gap-3 flex-wrap">
                                {
                                    categories.map((category, i) => {
                                    return (
                                        <button onClick={loadBlogByCategory} className={"tag " + (pageState == category ? " bg-black text-white " : " ")} key={i}>
                                            { category }
                                        </button>
                                    ) })
                                }
                            </div>
                        </div>
                    

                        <div>
                            <h1 className="font-medium text-xl mb-8">Announcement <i className="fi fi-rr-arrow-trend-up"></i></h1>

                            {
                                trendingBlogs == null ? <Loader /> :
                                trendingBlogs.length ?
                                    trendingBlogs.map((blog, i) => {
                                        return <AnimationWrapper transition={{ duration: 1,delay: i*0.1 }} key={i}>
                                            <MinimalBlogPost blog={blog} index={i} />
                                        </AnimationWrapper>
                                    })
                                : <NoDataMessage message="No Announcement posts"/>
                        }
                        </div>
                    </div>
                </div>
            </section>
        </AnimationWrapper>
    )
}

export default HomePage;