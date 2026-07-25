import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock, Message, Phone, WarningFilled, CircleCheckFilled, DataLine } from '@element-plus/icons-vue';
import { authApi } from '@/api/auth';
import BlobBackground from '@/components/BlobBackground.vue';
const router = useRouter();
const loading = ref(false);
const showError = ref(false);
const errorShown = ref(false);
const errorMessage = ref('');
const successShown = ref(false);
const successMessage = ref('');
const form = reactive({ username: '', password: '', confirmPassword: '', email: '', phone: '' });
function showFieldError(msg) {
    errorMessage.value = msg;
    showError.value = true;
    errorShown.value = true;
    successShown.value = false;
    setTimeout(() => { showError.value = false; }, 500);
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
        await authApi.register({ username: form.username, password: form.password, email: form.email || undefined, phone: form.phone || undefined });
        successMessage.value = '注册成功，即将跳转到登录页...';
        successShown.value = true;
        errorShown.value = false;
        setTimeout(() => { router.push({ name: 'Login' }); }, 1500);
    }
    catch (error) {
        const errData = error.response?.data;
        if (errData) {
            if (errData.username)
                showFieldError(Array.isArray(errData.username) ? errData.username[0] : errData.username);
            else if (errData.password)
                showFieldError(Array.isArray(errData.password) ? errData.password[0] : errData.password);
            else
                showFieldError(errData.detail || '注册失败，请稍后重试');
        }
        else {
            showFieldError('网络异常，请稍后重试');
        }
    }
    finally {
        loading.value = false;
    }
}
function goLogin() { router.push({ name: 'Login' }); }
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "register-container" },
});
/** @type {[typeof BlobBackground, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(BlobBackground, new BlobBackground({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
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
    ...{ onSubmit: (__VLS_ctx.handleRegister) },
    ...{ class: "register-form" },
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
    onKeyup: (__VLS_ctx.handleRegister)
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
    onKeyup: (__VLS_ctx.handleRegister)
};
var __VLS_22;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-group" },
});
const __VLS_27 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.confirmPassword),
    type: "password",
    size: "large",
    placeholder: "确认密码",
    prefixIcon: (__VLS_ctx.Lock),
    showPassword: true,
}));
const __VLS_29 = __VLS_28({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.confirmPassword),
    type: "password",
    size: "large",
    placeholder: "确认密码",
    prefixIcon: (__VLS_ctx.Lock),
    showPassword: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
let __VLS_31;
let __VLS_32;
let __VLS_33;
const __VLS_34 = {
    onKeyup: (__VLS_ctx.handleRegister)
};
var __VLS_30;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-group" },
});
const __VLS_35 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.email),
    size: "large",
    placeholder: "邮箱（选填）",
    prefixIcon: (__VLS_ctx.Message),
    clearable: true,
}));
const __VLS_37 = __VLS_36({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.email),
    size: "large",
    placeholder: "邮箱（选填）",
    prefixIcon: (__VLS_ctx.Message),
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_36));
let __VLS_39;
let __VLS_40;
let __VLS_41;
const __VLS_42 = {
    onKeyup: (__VLS_ctx.handleRegister)
};
var __VLS_38;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "input-group" },
});
const __VLS_43 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.phone),
    size: "large",
    placeholder: "手机号（选填）",
    prefixIcon: (__VLS_ctx.Phone),
    clearable: true,
}));
const __VLS_45 = __VLS_44({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.form.phone),
    size: "large",
    placeholder: "手机号（选填）",
    prefixIcon: (__VLS_ctx.Phone),
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_44));
let __VLS_47;
let __VLS_48;
let __VLS_49;
const __VLS_50 = {
    onKeyup: (__VLS_ctx.handleRegister)
};
var __VLS_46;
const __VLS_51 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    ...{ class: "register-button" },
    loading: (__VLS_ctx.loading),
}));
const __VLS_53 = __VLS_52({
    ...{ 'onClick': {} },
    type: "primary",
    size: "large",
    ...{ class: "register-button" },
    loading: (__VLS_ctx.loading),
}, ...__VLS_functionalComponentArgsRest(__VLS_52));
let __VLS_55;
let __VLS_56;
let __VLS_57;
const __VLS_58 = {
    onClick: (__VLS_ctx.handleRegister)
};
__VLS_54.slots.default;
(__VLS_ctx.loading ? '注册中...' : '注 册');
var __VLS_54;
const __VLS_59 = {}.transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ]} */ ;
// @ts-ignore
const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
    name: "fade",
}));
const __VLS_61 = __VLS_60({
    name: "fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_60));
__VLS_62.slots.default;
if (__VLS_ctx.errorShown) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-message" },
    });
    const __VLS_63 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_64 = __VLS_asFunctionalComponent(__VLS_63, new __VLS_63({}));
    const __VLS_65 = __VLS_64({}, ...__VLS_functionalComponentArgsRest(__VLS_64));
    __VLS_66.slots.default;
    const __VLS_67 = {}.WarningFilled;
    /** @type {[typeof __VLS_components.WarningFilled, ]} */ ;
    // @ts-ignore
    const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({}));
    const __VLS_69 = __VLS_68({}, ...__VLS_functionalComponentArgsRest(__VLS_68));
    var __VLS_66;
    (__VLS_ctx.errorMessage);
}
var __VLS_62;
const __VLS_71 = {}.transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ]} */ ;
// @ts-ignore
const __VLS_72 = __VLS_asFunctionalComponent(__VLS_71, new __VLS_71({
    name: "fade",
}));
const __VLS_73 = __VLS_72({
    name: "fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_72));
__VLS_74.slots.default;
if (__VLS_ctx.successShown) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "success-message" },
    });
    const __VLS_75 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({}));
    const __VLS_77 = __VLS_76({}, ...__VLS_functionalComponentArgsRest(__VLS_76));
    __VLS_78.slots.default;
    const __VLS_79 = {}.CircleCheckFilled;
    /** @type {[typeof __VLS_components.CircleCheckFilled, ]} */ ;
    // @ts-ignore
    const __VLS_80 = __VLS_asFunctionalComponent(__VLS_79, new __VLS_79({}));
    const __VLS_81 = __VLS_80({}, ...__VLS_functionalComponentArgsRest(__VLS_80));
    var __VLS_78;
    (__VLS_ctx.successMessage);
}
var __VLS_74;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "footer-hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
    ...{ onClick: (__VLS_ctx.goLogin) },
    ...{ class: "login-link" },
});
/** @type {__VLS_StyleScopedClasses['register-container']} */ ;
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
            BlobBackground: BlobBackground,
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
