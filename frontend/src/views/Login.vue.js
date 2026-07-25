import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Lock, WarningFilled, DataLine } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import BlobBackground from '@/components/BlobBackground.vue';
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const loading = ref(false);
const showError = ref(false);
const errorShown = ref(false);
const errorMessage = ref('');
const form = reactive({ username: '', password: '', remember: false });
async function handleLogin() {
    if (!form.username || !form.password) {
        showLoginError('请输入用户名和密码');
        return;
    }
    loading.value = true;
    try {
        await userStore.login({ username: form.username, password: form.password });
        const redirect = route.query.redirect || '/';
        router.push(redirect);
    }
    catch (error) {
        showLoginError(error.response?.data?.detail || '用户名或密码错误');
    }
    finally {
        loading.value = false;
    }
}
function showLoginError(msg) {
    errorMessage.value = msg;
    showError.value = true;
    errorShown.value = true;
    setTimeout(() => { showError.value = false; }, 500);
}
function goRegister() { router.push({ name: 'Register' }); }
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "login-container" },
});
/** @type {[typeof BlobBackground, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(BlobBackground, new BlobBackground({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
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
const __VLS_3 = {}.ElIcon;
/** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
    size: "40",
    color: "#007AFF",
}));
const __VLS_5 = __VLS_4({
    size: "40",
    color: "#007AFF",
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
__VLS_6.slots.default;
const __VLS_7 = {}.DataLine;
/** @type {[typeof __VLS_components.DataLine, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({}));
const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
var __VLS_6;
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
const __VLS_11 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.username),
    size: "large",
    placeholder: "用户名",
    prefixIcon: (__VLS_ctx.User),
    clearable: true,
}));
const __VLS_13 = __VLS_12({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.username),
    size: "large",
    placeholder: "用户名",
    prefixIcon: (__VLS_ctx.User),
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
let __VLS_15;
let __VLS_16;
let __VLS_17;
const __VLS_18 = {
    onKeyup: (__VLS_ctx.handleLogin)
};
var __VLS_14;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-group" },
});
const __VLS_19 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.password),
    type: "password",
    size: "large",
    placeholder: "密码",
    prefixIcon: (__VLS_ctx.Lock),
    showPassword: true,
}));
const __VLS_21 = __VLS_20({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.password),
    type: "password",
    size: "large",
    placeholder: "密码",
    prefixIcon: (__VLS_ctx.Lock),
    showPassword: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_20));
let __VLS_23;
let __VLS_24;
let __VLS_25;
const __VLS_26 = {
    onKeyup: (__VLS_ctx.handleLogin)
};
var __VLS_22;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "form-options" },
});
const __VLS_27 = {}.ElCheckbox;
/** @type {[typeof __VLS_components.ElCheckbox, typeof __VLS_components.elCheckbox, typeof __VLS_components.ElCheckbox, typeof __VLS_components.elCheckbox, ]} */ ;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
    modelValue: (__VLS_ctx.form.remember),
}));
const __VLS_29 = __VLS_28({
    modelValue: (__VLS_ctx.form.remember),
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
__VLS_30.slots.default;
var __VLS_30;
const __VLS_31 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    ...{ class: "login-button" },
    loading: (__VLS_ctx.loading),
}));
const __VLS_33 = __VLS_32({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    ...{ class: "login-button" },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
let __VLS_35;
let __VLS_36;
let __VLS_37;
const __VLS_38 = {
    onClick: (__VLS_ctx.handleLogin)
};
__VLS_34.slots.default;
(__VLS_ctx.loading ? '登录中...' : '登 录');
var __VLS_34;
const __VLS_39 = {}.transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ]} */ ;
// @ts-ignore
const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({
    name: "fade",
}));
const __VLS_41 = __VLS_40({
    name: "fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_40));
__VLS_42.slots.default;
if (__VLS_ctx.errorShown) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-message" },
    });
    const __VLS_43 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({}));
    const __VLS_45 = __VLS_44({}, ...__VLS_functionalComponentArgsRest(__VLS_44));
    __VLS_46.slots.default;
    const __VLS_47 = {}.WarningFilled;
    /** @type {[typeof __VLS_components.WarningFilled, ]} */ ;
    // @ts-ignore
    const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({}));
    const __VLS_49 = __VLS_48({}, ...__VLS_functionalComponentArgsRest(__VLS_48));
    var __VLS_46;
    (__VLS_ctx.errorMessage);
}
var __VLS_42;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "footer-hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    ...{ onClick: (__VLS_ctx.goRegister) },
    ...{ class: "register-link" },
});
/** @type {__VLS_StyleScopedClasses['login-container']} */ ;
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
            BlobBackground: BlobBackground,
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
