module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/lib/api.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ApiError",
    ()=>ApiError,
    "authApi",
    ()=>authApi,
    "postsApi",
    ()=>postsApi
]);
// Centralized API client for all backend requests
const BASE_URL = ("TURBOPACK compile-time value", "http://localhost:5001/api") || 'http://localhost:5001/api';
class ApiError extends Error {
    constructor(message, status){
        super(message);
        this.status = status;
    }
}
const getToken = ()=>{
    try {
        return localStorage.getItem('fb_token');
    } catch  {
        return null;
    }
};
const request = async (path, options = {})=>{
    const token = getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...token ? {
                Authorization: `Bearer ${token}`
            } : {},
            ...options.headers
        },
        ...options
    });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) {
        throw new ApiError(data.error || 'Something went wrong', res.status);
    }
    return data;
};
const authApi = {
    login: (email, password)=>request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password
            })
        }),
    register: (fields)=>request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(fields)
        }),
    me: ()=>request('/auth/me')
};
const postsApi = {
    /**
     * Fetch paginated feed.
     * @param {{ page?: number, limit?: number }} params
     */ getFeed: ({ page = 1, limit = 10 } = {})=>request(`/posts/feed?page=${page}&limit=${limit}`),
    /**
     * Create a post with optional image.
     * @param {{ content?: string, image?: File | null }} params
     */ create: ({ content, image })=>{
        const token = getToken();
        const form = new FormData();
        if (content) form.append('content', content);
        if (image) form.append('image', image);
        return fetch(`${BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                // Do NOT set Content-Type — browser sets it with the boundary
                ...token ? {
                    Authorization: `Bearer ${token}`
                } : {}
            },
            body: form
        }).then(async (res)=>{
            const data = await res.json().catch(()=>({}));
            if (!res.ok) {
                throw new ApiError(data.error || 'Something went wrong', res.status);
            }
            return data;
        });
    },
    /**
     * Add or update a reaction on a post.
     * @param {string} postId
     * @param {{ type?: string }} params — defaults to "like"
     */ like: (postId, { type = 'like' } = {})=>request(`/posts/${postId}/like`, {
            method: 'POST',
            body: JSON.stringify({
                type
            })
        }),
    /**
     * Remove reaction from a post.
     * @param {string} postId
     */ unlike: (postId)=>request(`/posts/${postId}/like`, {
            method: 'DELETE'
        }),
    /**
     * Fetch all comments for a post.
     * @param {string} postId
     */ getComments: (postId)=>request(`/posts/${postId}/comments`),
    /**
     * Create a comment or reply.
     * @param {string} postId
     * @param {{ content: string, parentId?: string }} params
     */ createComment: (postId, { content, parentId })=>request(`/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({
                content,
                parentId
            })
        })
};
;
}),
"[project]/src/context/AuthContext.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.js [app-ssr] (ecmascript)");
"use client";
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
const AuthProvider = ({ children })=>{
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    // Rehydrate from token on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const rehydrate = async ()=>{
            try {
                const token = localStorage.getItem('fb_token');
                if (!token) return;
                // Verify token is still valid by fetching current user
                const { user } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authApi"].me();
                setUser(user);
            } catch  {
                // Token expired or invalid — clear it
                localStorage.removeItem('fb_token');
                localStorage.removeItem('fb_user');
            } finally{
                setLoading(false);
            }
        };
        rehydrate();
    }, []);
    const login = (userData, token)=>{
        setUser(userData);
        localStorage.setItem('fb_token', token);
        localStorage.setItem('fb_user', JSON.stringify(userData));
    };
    const logout = ()=>{
        setUser(null);
        localStorage.removeItem('fb_token');
        localStorage.removeItem('fb_user');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            loading,
            login,
            logout
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/AuthContext.jsx",
        lineNumber: 45,
        columnNumber: 9
    }, ("TURBOPACK compile-time value", void 0));
};
const useAuth = ()=>{
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/dynamic-access-async-storage.external.js [external] (next/dist/server/app-render/dynamic-access-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/dynamic-access-async-storage.external.js", () => require("next/dist/server/app-render/dynamic-access-async-storage.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__139ml_0._.js.map