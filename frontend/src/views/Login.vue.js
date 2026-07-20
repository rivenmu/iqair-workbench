import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Lock, WarningFilled, DataLine } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const loading = ref(false);
const showError = ref(false);
const errorShown = ref(false);
const errorMessage = ref('');
const form = reactive({
    username: '',
    password: '',
    remember: false
});
async function handleLogin() {
    if (!form.username || !form.password) {
        showLoginError('请输入用户名和密码');
        return;
    }
    loading.value = true;
    try {
        await userStore.login({
            username: form.username,
            password: form.password
        });
        // 平滑过渡到导航页
        const redirect = route.query.redirect || '/projects';
        router.push(redirect);
    }
    catch (error) {
        const msg = error.response?.data?.detail || '用户名或密码错误';
        showLoginError(msg);
    }
    finally {
        loading.value = false;
    }
}
function showLoginError(msg) {
    errorMessage.value = msg;
    showError.value = true;
    errorShown.value = true;
    setTimeout(() => {
        showError.value = false;
    }, 500);
}
function goRegister() {
    router.push({ name: 'Register' });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "login-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "background-decoration" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "blob blob-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "blob blob-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "blob blob-3" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "login-card" },
    ...{ class: ({ 'shake-error': __VLS_ctx.showError }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "logo-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "logo-icon" },
});
const __VLS_0 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    size: "40",
    color: "#007AFF",
}));
const __VLS_2 = __VLS_1({
    size: "40",
    color: "#007AFF",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.DataLine;
/** @type {[typeof __VLS_components.DataLine, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.handleLogin) },
    ...{ class: "login-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-group" },
});
const __VLS_8 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.username),
    size: "large",
    placeholder: "用户名",
    prefixIcon: (__VLS_ctx.User),
    clearable: true,
}));
const __VLS_10 = __VLS_9({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.username),
    size: "large",
    placeholder: "用户名",
    prefixIcon: (__VLS_ctx.User),
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onKeyup: (__VLS_ctx.handleLogin)
};
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-group" },
});
const __VLS_16 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.password),
    type: "password",
    size: "large",
    placeholder: "密码",
    prefixIcon: (__VLS_ctx.Lock),
    showPassword: true,
}));
const __VLS_18 = __VLS_17({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.password),
    type: "password",
    size: "large",
    placeholder: "密码",
    prefixIcon: (__VLS_ctx.Lock),
    showPassword: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onKeyup: (__VLS_ctx.handleLogin)
};
var __VLS_19;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-options" },
});
const __VLS_24 = {}.ElCheckbox;
/** @type {[typeof __VLS_components.ElCheckbox, typeof __VLS_components.elCheckbox, typeof __VLS_components.ElCheckbox, typeof __VLS_components.elCheckbox, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    modelValue: (__VLS_ctx.form.remember),
}));
const __VLS_26 = __VLS_25({
    modelValue: (__VLS_ctx.form.remember),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
var __VLS_27;
const __VLS_28 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    ...{ class: "login-button" },
    loading: (__VLS_ctx.loading),
}));
const __VLS_30 = __VLS_29({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    ...{ class: "login-button" },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_32;
let __VLS_33;
let __VLS_34;
const __VLS_35 = {
    onClick: (__VLS_ctx.handleLogin)
};
__VLS_31.slots.default;
(__VLS_ctx.loading ? '登录中...' : '登 录');
var __VLS_31;
const __VLS_36 = {}.transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    name: "fade",
}));
const __VLS_38 = __VLS_37({
    name: "fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
if (__VLS_ctx.errorShown) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-message" },
    });
    const __VLS_40 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({}));
    const __VLS_42 = __VLS_41({}, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_43.slots.default;
    const __VLS_44 = {}.WarningFilled;
    /** @type {[typeof __VLS_components.WarningFilled, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({}));
    const __VLS_46 = __VLS_45({}, ...__VLS_functionalComponentArgsRest(__VLS_45));
    var __VLS_43;
    (__VLS_ctx.errorMessage);
}
var __VLS_39;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "footer-hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    ...{ onClick: (__VLS_ctx.goRegister) },
    ...{ class: "register-link" },
});
/** @type {__VLS_StyleScopedClasses['login-container']} */ ;
/** @type {__VLS_StyleScopedClasses['background-decoration']} */ ;
/** @type {__VLS_StyleScopedClasses['blob']} */ ;
/** @type {__VLS_StyleScopedClasses['blob-1']} */ ;
/** @type {__VLS_StyleScopedClasses['blob']} */ ;
/** @type {__VLS_StyleScopedClasses['blob-2']} */ ;
/** @type {__VLS_StyleScopedClasses['blob']} */ ;
/** @type {__VLS_StyleScopedClasses['blob-3']} */ ;
/** @type {__VLS_StyleScopedClasses['login-card']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-section']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['login-form']} */ ;
/** @type {__VLS_StyleScopedClasses['input-group']} */ ;
/** @type {__VLS_StyleScopedClasses['input-group']} */ ;
/** @type {__VLS_StyleScopedClasses['form-options']} */ ;
/** @type {__VLS_StyleScopedClasses['login-button']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['register-link']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            User: User,
            Lock: Lock,
            WarningFilled: WarningFilled,
            DataLine: DataLine,
            loading: loading,
            showError: showError,
            errorShown: errorShown,
            errorMessage: errorMessage,
            form: form,
            handleLogin: handleLogin,
            goRegister: goRegister,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
