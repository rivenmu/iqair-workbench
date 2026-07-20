import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock, Message, Phone, WarningFilled, CircleCheckFilled, DataLine } from '@element-plus/icons-vue';
import { authApi } from '@/api/auth';
const router = useRouter();
const loading = ref(false);
const showError = ref(false);
const errorShown = ref(false);
const errorMessage = ref('');
const successShown = ref(false);
const successMessage = ref('');
const form = reactive({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: ''
});
function showFieldError(msg) {
    errorMessage.value = msg;
    showError.value = true;
    errorShown.value = true;
    successShown.value = false;
    setTimeout(() => {
        showError.value = false;
    }, 500);
}
async function handleRegister() {
    errorShown.value = false;
    successShown.value = false;
    if (!form.username || !form.password) {
        showFieldError('请输入用户名和密码');
        return;
    }
    if (form.password !== form.confirmPassword) {
        showFieldError('两次输入的密码不一致');
        return;
    }
    loading.value = true;
    try {
        await authApi.register({
            username: form.username,
            password: form.password,
            email: form.email || undefined,
            phone: form.phone || undefined
        });
        successMessage.value = '注册成功，即将跳转到登录页...';
        successShown.value = true;
        errorShown.value = false;
        setTimeout(() => {
            router.push({ name: 'Login' });
        }, 1500);
    }
    catch (error) {
        const errData = error.response?.data;
        if (errData) {
            if (errData.username) {
                showFieldError(Array.isArray(errData.username) ? errData.username[0] : errData.username);
            }
            else if (errData.password) {
                showFieldError(Array.isArray(errData.password) ? errData.password[0] : errData.password);
            }
            else if (errData.email) {
                showFieldError(Array.isArray(errData.email) ? errData.email[0] : errData.email);
            }
            else {
                showFieldError(errData.detail || '注册失败，请稍后重试');
            }
        }
        else {
            showFieldError('网络异常，请稍后重试');
        }
    }
    finally {
        loading.value = false;
    }
}
function goLogin() {
    router.push({ name: 'Login' });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "register-container" },
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
    ...{ class: "register-card" },
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
    ...{ onSubmit: (__VLS_ctx.handleRegister) },
    ...{ class: "register-form" },
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
    onKeyup: (__VLS_ctx.handleRegister)
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
    onKeyup: (__VLS_ctx.handleRegister)
};
var __VLS_19;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-group" },
});
const __VLS_24 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.confirmPassword),
    type: "password",
    size: "large",
    placeholder: "确认密码",
    prefixIcon: (__VLS_ctx.Lock),
    showPassword: true,
}));
const __VLS_26 = __VLS_25({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.confirmPassword),
    type: "password",
    size: "large",
    placeholder: "确认密码",
    prefixIcon: (__VLS_ctx.Lock),
    showPassword: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onKeyup: (__VLS_ctx.handleRegister)
};
var __VLS_27;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-group" },
});
const __VLS_32 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.email),
    size: "large",
    placeholder: "邮箱（选填）",
    prefixIcon: (__VLS_ctx.Message),
    clearable: true,
}));
const __VLS_34 = __VLS_33({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.email),
    size: "large",
    placeholder: "邮箱（选填）",
    prefixIcon: (__VLS_ctx.Message),
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
let __VLS_36;
let __VLS_37;
let __VLS_38;
const __VLS_39 = {
    onKeyup: (__VLS_ctx.handleRegister)
};
var __VLS_35;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-group" },
});
const __VLS_40 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.phone),
    size: "large",
    placeholder: "手机号（选填）",
    prefixIcon: (__VLS_ctx.Phone),
    clearable: true,
}));
const __VLS_42 = __VLS_41({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.phone),
    size: "large",
    placeholder: "手机号（选填）",
    prefixIcon: (__VLS_ctx.Phone),
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
let __VLS_44;
let __VLS_45;
let __VLS_46;
const __VLS_47 = {
    onKeyup: (__VLS_ctx.handleRegister)
};
var __VLS_43;
const __VLS_48 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    ...{ class: "register-button" },
    loading: (__VLS_ctx.loading),
}));
const __VLS_50 = __VLS_49({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    ...{ class: "register-button" },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
let __VLS_52;
let __VLS_53;
let __VLS_54;
const __VLS_55 = {
    onClick: (__VLS_ctx.handleRegister)
};
__VLS_51.slots.default;
(__VLS_ctx.loading ? '注册中...' : '注 册');
var __VLS_51;
const __VLS_56 = {}.transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    name: "fade",
}));
const __VLS_58 = __VLS_57({
    name: "fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
if (__VLS_ctx.errorShown) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-message" },
    });
    const __VLS_60 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({}));
    const __VLS_62 = __VLS_61({}, ...__VLS_functionalComponentArgsRest(__VLS_61));
    __VLS_63.slots.default;
    const __VLS_64 = {}.WarningFilled;
    /** @type {[typeof __VLS_components.WarningFilled, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({}));
    const __VLS_66 = __VLS_65({}, ...__VLS_functionalComponentArgsRest(__VLS_65));
    var __VLS_63;
    (__VLS_ctx.errorMessage);
}
var __VLS_59;
const __VLS_68 = {}.transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    name: "fade",
}));
const __VLS_70 = __VLS_69({
    name: "fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_71.slots.default;
if (__VLS_ctx.successShown) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "success-message" },
    });
    const __VLS_72 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({}));
    const __VLS_74 = __VLS_73({}, ...__VLS_functionalComponentArgsRest(__VLS_73));
    __VLS_75.slots.default;
    const __VLS_76 = {}.CircleCheckFilled;
    /** @type {[typeof __VLS_components.CircleCheckFilled, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({}));
    const __VLS_78 = __VLS_77({}, ...__VLS_functionalComponentArgsRest(__VLS_77));
    var __VLS_75;
    (__VLS_ctx.successMessage);
}
var __VLS_71;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "footer-hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    ...{ onClick: (__VLS_ctx.goLogin) },
    ...{ class: "login-link" },
});
/** @type {__VLS_StyleScopedClasses['register-container']} */ ;
/** @type {__VLS_StyleScopedClasses['background-decoration']} */ ;
/** @type {__VLS_StyleScopedClasses['blob']} */ ;
/** @type {__VLS_StyleScopedClasses['blob-1']} */ ;
/** @type {__VLS_StyleScopedClasses['blob']} */ ;
/** @type {__VLS_StyleScopedClasses['blob-2']} */ ;
/** @type {__VLS_StyleScopedClasses['blob']} */ ;
/** @type {__VLS_StyleScopedClasses['blob-3']} */ ;
/** @type {__VLS_StyleScopedClasses['register-card']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-section']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['register-form']} */ ;
/** @type {__VLS_StyleScopedClasses['input-group']} */ ;
/** @type {__VLS_StyleScopedClasses['input-group']} */ ;
/** @type {__VLS_StyleScopedClasses['input-group']} */ ;
/** @type {__VLS_StyleScopedClasses['input-group']} */ ;
/** @type {__VLS_StyleScopedClasses['input-group']} */ ;
/** @type {__VLS_StyleScopedClasses['register-button']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['success-message']} */ ;
/** @type {__VLS_StyleScopedClasses['footer-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['login-link']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            User: User,
            Lock: Lock,
            Message: Message,
            Phone: Phone,
            WarningFilled: WarningFilled,
            CircleCheckFilled: CircleCheckFilled,
            DataLine: DataLine,
            loading: loading,
            showError: showError,
            errorShown: errorShown,
            errorMessage: errorMessage,
            successShown: successShown,
            successMessage: successMessage,
            form: form,
            handleRegister: handleRegister,
            goLogin: goLogin,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
