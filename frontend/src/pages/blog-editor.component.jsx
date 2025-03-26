import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../App';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AnimationWrapper from '../common/page-animation';
import Loader from '../components/loader.component';

const BlogEditor = () => {
    const { userAuth: { access_token } } = useContext(UserContext);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [blog, setBlog] = useState({
        title: '',
        banner: '',
        content: '',
        tags: [],
        des: '',
        draft: true
    });

    const handleBannerUpload = async (e) => {
        const file = e.target.files[0];
        
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            toast.error('Only JPEG, JPG and PNG files are allowed');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('banner', file);

            console.log('Starting banner upload...', {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size
            });

            const { data } = await axios.post('/api/blog/upload-banner', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${access_token}`
                }
            });

            console.log('Banner upload response:', data);

            if (data?.imageUrl) {
                setBlog(prev => ({
                    ...prev,
                    banner: data.imageUrl
                }));
                toast.success('Banner uploaded successfully');
            } else {
                throw new Error('No image URL returned from server');
            }
        } catch (error) {
            console.error('Banner upload error:', error.response || error);
            toast.error(error.response?.data?.error || error.message || 'Failed to upload banner');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleImageUpload = async (file) => {
        if (!file) return null;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            toast.error('Only JPEG, JPG and PNG files are allowed');
            return null;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return null;
        }

        try {
            const formData = new FormData();
            formData.append('image', file);

            console.log('Starting image upload...', {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size
            });

            const { data } = await axios.post('/api/blog/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${access_token}`
                }
            });

            console.log('Image upload response:', data);

            if (!data?.imageUrl) {
                throw new Error('No image URL returned from upload');
            }

            return data.imageUrl;
        } catch (error) {
            console.error('Image upload error:', error.response || error);
            toast.error(error.response?.data?.error || error.message || 'Failed to upload image');
            return null;
        }
    };

    const handlePublish = async () => {
        if (!blog.title.length) {
            return toast.error('Please provide a title');
        }
        if (!blog.banner.length) {
            return toast.error('Please upload a banner image');
        }
        if (!blog.content.length) {
            return toast.error('Please write some content');
        }

        try {
            setLoading(true);
            const { data } = await axios.post('/api/blog/create', {
                ...blog,
                draft: false
            }, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });

            toast.success('Blog published successfully');
            // Redirect to the published blog
            window.location.href = `/blog/${data.blog_id}`;
        } catch (error) {
            console.error('Blog publish error:', error);
            toast.error(error.response?.data?.error || 'Failed to publish blog');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimationWrapper>
            {loading ? <Loader /> : (
                <div className="max-w-[900px] w-full mx-auto py-8 px-4">
                    <div className="w-full aspect-video rounded-lg border-2 border-grey hover:border-dark-grey/50 bg-grey/10 overflow-hidden mb-8">
                        <label htmlFor="banner" className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer">
                            {blog.banner ? (
                                <img 
                                    src={blog.banner} 
                                    alt="Blog banner" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-center">
                                    <i className="fi fi-rr-picture text-2xl mb-2"></i>
                                    <p>Upload banner image</p>
                                </div>
                            )}
                            
                            {uploadingImage && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="loading-spinner"></div>
                                </div>
                            )}
                        </label>
                        <input 
                            type="file" 
                            id="banner" 
                            accept="image/jpeg, image/jpg, image/png" 
                            hidden 
                            onChange={handleBannerUpload}
                            disabled={uploadingImage}
                        />
                    </div>

                    <input 
                        type="text"
                        placeholder="Blog Title"
                        className="text-4xl font-medium w-full h-20 outline-none resize-none mb-4 bg-transparent"
                        value={blog.title}
                        onChange={(e) => setBlog(prev => ({ ...prev, title: e.target.value }))}
                    />

                    <textarea 
                        placeholder="Write your blog content here..."
                        className="w-full outline-none resize-none mt-8 mb-4 bg-transparent"
                        value={blog.content}
                        onChange={(e) => setBlog(prev => ({ ...prev, content: e.target.value }))}
                    />

                    <div className="flex gap-4 mt-8">
                        <button 
                            className="btn-dark px-8"
                            onClick={handlePublish}
                            disabled={loading || uploadingImage}
                        >
                            Publish
                        </button>
                        <button 
                            className="btn-light px-8"
                            onClick={() => setBlog(prev => ({ ...prev, draft: true }))}
                            disabled={loading || uploadingImage}
                        >
                            Save as Draft
                        </button>
                    </div>
                </div>
            )}
        </AnimationWrapper>
    );
};

export default BlogEditor; 