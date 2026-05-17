(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/api.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ApiError",
    ()=>ApiError,
    "authApi",
    ()=>authApi,
    "postsApi",
    ()=>postsApi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
// Centralized API client for all backend requests
const BASE_URL = ("TURBOPACK compile-time value", "http://localhost:5000/api") || 'http://localhost:5000/api';
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/context/AuthContext.jsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
const AuthProvider = ({ children })=>{
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Rehydrate from token on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const rehydrate = {
                "AuthProvider.useEffect.rehydrate": async ()=>{
                    try {
                        const token = localStorage.getItem('fb_token');
                        if (!token) return;
                        // Verify token is still valid by fetching current user
                        const { user: user_0 } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authApi"].me();
                        setUser(user_0);
                    } catch  {
                        // Token expired or invalid — clear it
                        localStorage.removeItem('fb_token');
                        localStorage.removeItem('fb_user');
                    } finally{
                        setLoading(false);
                    }
                }
            }["AuthProvider.useEffect.rehydrate"];
            rehydrate();
        }
    }["AuthProvider.useEffect"], []);
    const login = (userData, token_0)=>{
        setUser(userData);
        localStorage.setItem('fb_token', token_0);
        localStorage.setItem('fb_user', JSON.stringify(userData));
    };
    const logout = ()=>{
        setUser(null);
        localStorage.removeItem('fb_token');
        localStorage.removeItem('fb_user');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
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
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0));
};
_s(AuthProvider, "NiO5z6JIqzX62LS5UWDgIqbZYyY=");
_c = AuthProvider;
const useAuth = ()=>{
    _s1();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(1);
    if ($[0] !== "06d5d2aea147aecf9214f8f7b73021c0cd38a396ff133aab5f2c0386291bc25c") {
        for(let $i = 0; $i < 1; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "06d5d2aea147aecf9214f8f7b73021c0cd38a396ff133aab5f2c0386291bc25c";
    }
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return ctx;
};
_s1(useAuth, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_0r0s0s8._.js.map