import mongoose from "mongoose";

let profile_imgs_name_list = [
  "Garfield",
  "Tinkerbell",
  "Annie",
  "Loki",
  "Cleo",
  "Angel",
  "Bob",
  "Mia",
  "Coco",
  "Gracie",
  "Bear",
  "Bella",
  "Abby",
  "Harley",
  "Cali",
  "Leo",
  "Luna",
  "Jack",
  "Felix",
  "Kiki",
];
let profile_imgs_collections_list = [
  "notionists-neutral",
  "adventurer-neutral",
  "fun-emoji",
];

const userSchema = new mongoose.Schema({
    personal_info: {
        fullname: {
            type: String,
            required: [true, "Full name is required"],
            minLength: [3, "Full name must be at least 3 characters long"]
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            match: [/@gecidukki.ac.in$/, "Must use a valid GECI email"]
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minLength: [6, "Password must be at least 6 characters long"]
        },
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            minLength: [3, "Username must be at least 3 characters long"]
        },
        role: {
            type: String,
            required: [true, "Role is required"],
            enum: {
                values: ["Student", "Alumni", "Faculty"],
                message: "Role must be either Student, Alumni, or Faculty"
            }
        },
        ktu_id: {
            type: String,
            required: function() {
                return this.personal_info.role === "Student" || this.personal_info.role === "Alumni";
            },
            validate: {
                validator: function(v) {
                    if (this.personal_info.role === "Faculty") return true;
                    return /^(IDK|LIDK)[0-9A-Z]+$/.test(v);
                },
                message: "KTU ID must start with IDK or LIDK followed by numbers and uppercase letters"
            },
            unique: true,
            sparse: true
        },
        passout_year: {
            type: Number,
            required: function() {
                return this.personal_info.role === "Alumni";
            },
            validate: {
                validator: function(v) {
                    if (this.personal_info.role !== "Alumni") return true;
                    const currentYear = new Date().getFullYear();
                    return v >= 2010 && v <= currentYear;
                },
                message: "Passout year must be between 2010 and current year"
            }
        },
        department: {
            type: String,
            required: [true, "Department is required"],
            enum: {
                values: [
                    "Computer Science and Engineering",
                    "Electronics and Communication",
                    "Electrical and Electronics",
                    "Civil Engineering",
                    "Mechanical Engineering"
                ],
                message: "Invalid department selected"
            }
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            unique: true,
            validate: {
                validator: function(v) {
                    return /^\+91[0-9]{10}$/.test(v);
                },
                message: "Phone number must start with +91 followed by 10 digits"
            }
        },
        bio: {
            type: String,
            default: "",
            maxLength: [1000, "Bio cannot be longer than 1000 characters"]
        },
        profile_img: {
            type: String,
            default: function() {
                const random_index = Math.floor(Math.random() * profile_imgs_name_list.length);
                const random_collection = profile_imgs_collections_list[Math.floor(Math.random() * profile_imgs_collections_list.length)];
                return `https://api.dicebear.com/6.x/${random_collection}/svg?seed=${profile_imgs_name_list[random_index]}`;
            }
        }
    },
    social_links: {
        youtube: {
            type: String,
            default: ""
        },
        instagram: {
            type: String,
            default: ""
        },
        facebook: {
            type: String,
            default: ""
        },
        twitter: {
            type: String,
            default: ""
        },
        github: {
            type: String,
            default: ""
        },
        website: {
            type: String,
            default: ""
        }
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to handle username generation
userSchema.pre('save', function(next) {
    if (this.isNew) {
        this.personal_info.username = this.personal_info.email.split('@')[0];
    }
    next();
});

export default mongoose.model("User", userSchema);

const validateForm = (formData) => {
    const errors = {};
    
    if (!formData.email.endsWith('@gecidukki.ac.in')) {
        errors.email = 'Must use @gecidukki.ac.in email';
    }
    
    if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.fullname.length < 3) {
        errors.fullname = 'Full name must be at least 3 characters';
    }
    
    if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
    }

    if (formData.role === "Student" || formData.role === "Alumni") {
        if (!formData.ktu_id) {
            errors.ktu_id = 'KTU ID is required';
        } else if (!/^(IDK|LIDK)[0-9A-Z]+$/.test(formData.ktu_id)) {
            errors.ktu_id = 'KTU ID must start with IDK or LIDK';
        }
    }

    if (formData.role === "Alumni") {
        const currentYear = new Date().getFullYear();
        if (!formData.passout_year) {
            errors.passout_year = 'Passout year is required for alumni';
        } else if (formData.passout_year < 1995 || formData.passout_year > currentYear) {
            errors.passout_year = 'Invalid passout year';
        }
    }
    
    return errors;
};
