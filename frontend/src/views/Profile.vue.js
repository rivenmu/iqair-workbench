import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import MainLayout from '@/layouts/MainLayout.vue';
import { authApi } from '@/api/auth';
import { useUserStore } from '@/stores/user';
import dayjs from 'dayjs';
const userStore = useUserStore();
const changing = ref(false);
const passwordFormRef = ref();
const passwordForm = reactive({
    old_password: '',
    new_password: '',
    confirm_password: ''
});
const passwordValidator = (rule, value, callback) => {
    if (!value) {
        callback(new Error('请输入密码'));
    }
    else {
        callback();
    }
};
const confirmPasswordValidator = (rule, value, callback) => {
    if (!value) {
        callback(new Error('请再次输入密码'));
    }
    else if (value !== passwordForm.new_password) {
        callback(new Error('两次输入的密码不一致'));
    }
    else {
        callback();
    }
};
const passwordRules = {
    old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
    new_password: [{ required: true, validator: passwordValidator, trigger: 'blur' }],
    confirm_password: [{ required: true, validator: confirmPasswordValidator, trigger: 'blur' }]
};
function formatDate(date) {
    return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '未知';
}
async function handleChangePassword() {
    if (!passwordFormRef.value)
        return;
    await passwordFormRef.value.validate(async (valid) => {
        if (!valid)
            return;
        changing.value = true;
        try {
            await authApi.changePassword({
                old_password: passwordForm.old_password,
                new_password: passwordForm.new_password
            });
            ElMessage.success('密码修改成功，请重新登录');
            userStore.logout();
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        }
        catch (error) {
            // 错误已在拦截器处理
        }
        finally {
            changing.value = false;
        }
    });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['profile-content']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
// CSS variable injection 
// CSS variable injection end 
/** @type {[typeof MainLayout, typeof MainLayout, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(MainLayout, new MainLayout({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "profile-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "page-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "profile-content" },
});
const __VLS_4 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ class: "info-card" },
}));
const __VLS_6 = __VLS_5({
    ...{ class: "info-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_7.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "card-title" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-list" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "info-value" },
});
(__VLS_ctx.userStore.userInfo?.username);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "info-label" },
});
const __VLS_8 = {}.ElTag;
/** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    type: (__VLS_ctx.userStore.isAdmin ? 'danger' : 'info'),
}));
const __VLS_10 = __VLS_9({
    type: (__VLS_ctx.userStore.isAdmin ? 'danger' : 'info'),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
(__VLS_ctx.userStore.userInfo?.role === 'admin' ? '管理员' : '普通用户');
var __VLS_11;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "info-value" },
});
(__VLS_ctx.userStore.userInfo?.email || '未设置');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "info-value" },
});
(__VLS_ctx.userStore.userInfo?.phone || '未设置');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "info-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "info-value" },
});
(__VLS_ctx.formatDate(__VLS_ctx.userStore.userInfo?.created_at));
var __VLS_7;
const __VLS_12 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ class: "password-card" },
}));
const __VLS_14 = __VLS_13({
    ...{ class: "password-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_15.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "card-title" },
    });
}
const __VLS_16 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    model: (__VLS_ctx.passwordForm),
    rules: (__VLS_ctx.passwordRules),
    ref: "passwordFormRef",
    labelWidth: "100px",
}));
const __VLS_18 = __VLS_17({
    model: (__VLS_ctx.passwordForm),
    rules: (__VLS_ctx.passwordRules),
    ref: "passwordFormRef",
    labelWidth: "100px",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
/** @type {typeof __VLS_ctx.passwordFormRef} */ ;
var __VLS_20 = {};
__VLS_19.slots.default;
const __VLS_22 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_23 = __VLS_asFunctionalComponent(__VLS_22, new __VLS_22({
    label: "原密码",
    prop: "old_password",
}));
const __VLS_24 = __VLS_23({
    label: "原密码",
    prop: "old_password",
}, ...__VLS_functionalComponentArgsRest(__VLS_23));
__VLS_25.slots.default;
const __VLS_26 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
    modelValue: (__VLS_ctx.passwordForm.old_password),
    type: "password",
    placeholder: "请输入原密码",
    showPassword: true,
}));
const __VLS_28 = __VLS_27({
    modelValue: (__VLS_ctx.passwordForm.old_password),
    type: "password",
    placeholder: "请输入原密码",
    showPassword: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_27));
var __VLS_25;
const __VLS_30 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_31 = __VLS_asFunctionalComponent(__VLS_30, new __VLS_30({
    label: "新密码",
    prop: "new_password",
}));
const __VLS_32 = __VLS_31({
    label: "新密码",
    prop: "new_password",
}, ...__VLS_functionalComponentArgsRest(__VLS_31));
__VLS_33.slots.default;
const __VLS_34 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_35 = __VLS_asFunctionalComponent(__VLS_34, new __VLS_34({
    modelValue: (__VLS_ctx.passwordForm.new_password),
    type: "password",
    placeholder: "至少8位，包含字母和数字",
    showPassword: true,
}));
const __VLS_36 = __VLS_35({
    modelValue: (__VLS_ctx.passwordForm.new_password),
    type: "password",
    placeholder: "至少8位，包含字母和数字",
    showPassword: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_35));
var __VLS_33;
const __VLS_38 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_39 = __VLS_asFunctionalComponent(__VLS_38, new __VLS_38({
    label: "确认密码",
    prop: "confirm_password",
}));
const __VLS_40 = __VLS_39({
    label: "确认密码",
    prop: "confirm_password",
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
__VLS_41.slots.default;
const __VLS_42 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_43 = __VLS_asFunctionalComponent(__VLS_42, new __VLS_42({
    modelValue: (__VLS_ctx.passwordForm.confirm_password),
    type: "password",
    placeholder: "请再次输入新密码",
    showPassword: true,
}));
const __VLS_44 = __VLS_43({
    modelValue: (__VLS_ctx.passwordForm.confirm_password),
    type: "password",
    placeholder: "请再次输入新密码",
    showPassword: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_43));
var __VLS_41;
const __VLS_46 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_47 = __VLS_asFunctionalComponent(__VLS_46, new __VLS_46({}));
const __VLS_48 = __VLS_47({}, ...__VLS_functionalComponentArgsRest(__VLS_47));
__VLS_49.slots.default;
const __VLS_50 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_51 = __VLS_asFunctionalComponent(__VLS_50, new __VLS_50({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.changing),
}));
const __VLS_52 = __VLS_51({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.changing),
}, ...__VLS_functionalComponentArgsRest(__VLS_51));
let __VLS_54;
let __VLS_55;
let __VLS_56;
const __VLS_57 = {
    onClick: (__VLS_ctx.handleChangePassword)
};
__VLS_53.slots.default;
var __VLS_53;
var __VLS_49;
var __VLS_19;
var __VLS_15;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['profile-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
/** @type {__VLS_StyleScopedClasses['profile-content']} */ ;
/** @type {__VLS_StyleScopedClasses['info-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['info-list']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['info-row']} */ ;
/** @type {__VLS_StyleScopedClasses['info-label']} */ ;
/** @type {__VLS_StyleScopedClasses['info-value']} */ ;
/** @type {__VLS_StyleScopedClasses['password-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
// @ts-ignore
var __VLS_21 = __VLS_20;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            MainLayout: MainLayout,
            userStore: userStore,
            changing: changing,
            passwordFormRef: passwordFormRef,
            passwordForm: passwordForm,
            passwordRules: passwordRules,
            formatDate: formatDate,
            handleChangePassword: handleChangePassword,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
