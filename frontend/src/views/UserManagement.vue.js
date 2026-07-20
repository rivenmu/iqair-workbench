import { ref, reactive, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import MainLayout from '@/layouts/MainLayout.vue';
import { authApi } from '@/api/auth';
import dayjs from 'dayjs';
const loading = ref(false);
const adding = ref(false);
const resetting = ref(false);
const users = ref([]);
const addDialogVisible = ref(false);
const resetDialogVisible = ref(false);
const currentUser = ref(null);
const addFormRef = ref();
const resetFormRef = ref();
const addForm = reactive({
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'user'
});
const resetForm = reactive({
    new_password: ''
});
const passwordValidator = (rule, value, callback) => {
    if (!value) {
        callback(new Error('请输入密码'));
    }
    else {
        callback();
    }
};
const addRules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, validator: passwordValidator, trigger: 'blur' }],
    role: [{ required: true, message: '请选择角色', trigger: 'change' }]
};
const resetRules = {
    new_password: [{ required: true, validator: passwordValidator, trigger: 'blur' }]
};
function formatDate(date) {
    return dayjs(date).format('YYYY-MM-DD HH:mm');
}
async function fetchUsers() {
    loading.value = true;
    try {
        const data = await authApi.getUsers();
        users.value = Array.isArray(data) ? data : [];
    }
    catch (error) {
        users.value = [];
    }
    finally {
        loading.value = false;
    }
}
function openAddDialog() {
    Object.assign(addForm, { username: '', password: '', email: '', phone: '', role: 'user' });
    addDialogVisible.value = true;
}
function openResetDialog(user) {
    currentUser.value = user;
    resetForm.new_password = '';
    resetDialogVisible.value = true;
}
async function handleAdd() {
    if (!addFormRef.value)
        return;
    await addFormRef.value.validate(async (valid) => {
        if (!valid)
            return;
        adding.value = true;
        try {
            await authApi.createUser(addForm);
            ElMessage.success('用户添加成功');
            addDialogVisible.value = false;
            fetchUsers();
        }
        catch (error) {
            // 错误已在拦截器处理
        }
        finally {
            adding.value = false;
        }
    });
}
async function handleReset() {
    if (!resetFormRef.value || !currentUser.value)
        return;
    await resetFormRef.value.validate(async (valid) => {
        if (!valid)
            return;
        resetting.value = true;
        try {
            await authApi.resetPassword(currentUser.value.id, resetForm);
            ElMessage.success('密码重置成功');
            resetDialogVisible.value = false;
        }
        catch (error) {
            // 错误已在拦截器处理
        }
        finally {
            resetting.value = false;
        }
    });
}
async function handleDelete(user) {
    try {
        await ElMessageBox.confirm(`确定要删除用户 "${user.username}" 吗？此操作不可恢复。`, '删除确认', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' });
        await authApi.deleteUser(user.id);
        ElMessage.success('用户删除成功');
        fetchUsers();
    }
    catch (error) {
        // 用户取消或错误
    }
}
onMounted(() => {
    fetchUsers();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
/** @type {[typeof MainLayout, typeof MainLayout, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(MainLayout, new MainLayout({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "user-management" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "page-title" },
});
const __VLS_4 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onClick': {} },
    type: "primary",
    icon: (__VLS_ctx.Plus),
}));
const __VLS_6 = __VLS_5({
    ...{ 'onClick': {} },
    type: "primary",
    icon: (__VLS_ctx.Plus),
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onClick: (__VLS_ctx.openAddDialog)
};
__VLS_7.slots.default;
var __VLS_7;
const __VLS_12 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ class: "user-table-card" },
}));
const __VLS_14 = __VLS_13({
    ...{ class: "user-table-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading) }, null, null);
__VLS_15.slots.default;
const __VLS_16 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    data: (__VLS_ctx.users),
    ...{ style: {} },
}));
const __VLS_18 = __VLS_17({
    data: (__VLS_ctx.users),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
const __VLS_20 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    prop: "username",
    label: "用户名",
    minWidth: "120",
}));
const __VLS_22 = __VLS_21({
    prop: "username",
    label: "用户名",
    minWidth: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
const __VLS_24 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    prop: "email",
    label: "邮箱",
    minWidth: "180",
}));
const __VLS_26 = __VLS_25({
    prop: "email",
    label: "邮箱",
    minWidth: "180",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
const __VLS_28 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    prop: "role_display",
    label: "角色",
    width: "100",
}));
const __VLS_30 = __VLS_29({
    prop: "role_display",
    label: "角色",
    width: "100",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_31.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_32 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        type: (row.role === 'admin' ? 'danger' : 'info'),
    }));
    const __VLS_34 = __VLS_33({
        type: (row.role === 'admin' ? 'danger' : 'info'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_35.slots.default;
    (row.role_display);
    var __VLS_35;
}
var __VLS_31;
const __VLS_36 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    prop: "phone",
    label: "手机号",
    width: "140",
}));
const __VLS_38 = __VLS_37({
    prop: "phone",
    label: "手机号",
    width: "140",
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
const __VLS_40 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    prop: "created_at",
    label: "创建时间",
    width: "180",
}));
const __VLS_42 = __VLS_41({
    prop: "created_at",
    label: "创建时间",
    width: "180",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_43.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    (__VLS_ctx.formatDate(row.created_at));
}
var __VLS_43;
const __VLS_44 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    prop: "last_login",
    label: "最后登录",
    width: "180",
}));
const __VLS_46 = __VLS_45({
    prop: "last_login",
    label: "最后登录",
    width: "180",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_47.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    (row.last_login ? __VLS_ctx.formatDate(row.last_login) : '从未登录');
}
var __VLS_47;
const __VLS_48 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    label: "操作",
    width: "200",
    fixed: "right",
}));
const __VLS_50 = __VLS_49({
    label: "操作",
    width: "200",
    fixed: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_51.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_52 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        ...{ 'onClick': {} },
        size: "small",
    }));
    const __VLS_54 = __VLS_53({
        ...{ 'onClick': {} },
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    let __VLS_56;
    let __VLS_57;
    let __VLS_58;
    const __VLS_59 = {
        onClick: (...[$event]) => {
            __VLS_ctx.openResetDialog(row);
        }
    };
    __VLS_55.slots.default;
    var __VLS_55;
    const __VLS_60 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        ...{ 'onClick': {} },
        size: "small",
        type: "danger",
        disabled: (row.username === 'admin'),
    }));
    const __VLS_62 = __VLS_61({
        ...{ 'onClick': {} },
        size: "small",
        type: "danger",
        disabled: (row.username === 'admin'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    let __VLS_64;
    let __VLS_65;
    let __VLS_66;
    const __VLS_67 = {
        onClick: (...[$event]) => {
            __VLS_ctx.handleDelete(row);
        }
    };
    __VLS_63.slots.default;
    var __VLS_63;
}
var __VLS_51;
var __VLS_19;
var __VLS_15;
const __VLS_68 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    modelValue: (__VLS_ctx.addDialogVisible),
    title: "新增用户",
    width: "480px",
}));
const __VLS_70 = __VLS_69({
    modelValue: (__VLS_ctx.addDialogVisible),
    title: "新增用户",
    width: "480px",
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
__VLS_71.slots.default;
const __VLS_72 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    model: (__VLS_ctx.addForm),
    rules: (__VLS_ctx.addRules),
    ref: "addFormRef",
    labelWidth: "80px",
}));
const __VLS_74 = __VLS_73({
    model: (__VLS_ctx.addForm),
    rules: (__VLS_ctx.addRules),
    ref: "addFormRef",
    labelWidth: "80px",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
/** @type {typeof __VLS_ctx.addFormRef} */ ;
var __VLS_76 = {};
__VLS_75.slots.default;
const __VLS_78 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_79 = __VLS_asFunctionalComponent(__VLS_78, new __VLS_78({
    label: "用户名",
    prop: "username",
}));
const __VLS_80 = __VLS_79({
    label: "用户名",
    prop: "username",
}, ...__VLS_functionalComponentArgsRest(__VLS_79));
__VLS_81.slots.default;
const __VLS_82 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_83 = __VLS_asFunctionalComponent(__VLS_82, new __VLS_82({
    modelValue: (__VLS_ctx.addForm.username),
    placeholder: "请输入用户名",
}));
const __VLS_84 = __VLS_83({
    modelValue: (__VLS_ctx.addForm.username),
    placeholder: "请输入用户名",
}, ...__VLS_functionalComponentArgsRest(__VLS_83));
var __VLS_81;
const __VLS_86 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_87 = __VLS_asFunctionalComponent(__VLS_86, new __VLS_86({
    label: "密码",
    prop: "password",
}));
const __VLS_88 = __VLS_87({
    label: "密码",
    prop: "password",
}, ...__VLS_functionalComponentArgsRest(__VLS_87));
__VLS_89.slots.default;
const __VLS_90 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_91 = __VLS_asFunctionalComponent(__VLS_90, new __VLS_90({
    modelValue: (__VLS_ctx.addForm.password),
    type: "password",
    placeholder: "至少8位，含字母和数字",
    showPassword: true,
}));
const __VLS_92 = __VLS_91({
    modelValue: (__VLS_ctx.addForm.password),
    type: "password",
    placeholder: "至少8位，含字母和数字",
    showPassword: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_91));
var __VLS_89;
const __VLS_94 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_95 = __VLS_asFunctionalComponent(__VLS_94, new __VLS_94({
    label: "邮箱",
    prop: "email",
}));
const __VLS_96 = __VLS_95({
    label: "邮箱",
    prop: "email",
}, ...__VLS_functionalComponentArgsRest(__VLS_95));
__VLS_97.slots.default;
const __VLS_98 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_99 = __VLS_asFunctionalComponent(__VLS_98, new __VLS_98({
    modelValue: (__VLS_ctx.addForm.email),
    placeholder: "邮箱地址",
}));
const __VLS_100 = __VLS_99({
    modelValue: (__VLS_ctx.addForm.email),
    placeholder: "邮箱地址",
}, ...__VLS_functionalComponentArgsRest(__VLS_99));
var __VLS_97;
const __VLS_102 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_103 = __VLS_asFunctionalComponent(__VLS_102, new __VLS_102({
    label: "手机号",
}));
const __VLS_104 = __VLS_103({
    label: "手机号",
}, ...__VLS_functionalComponentArgsRest(__VLS_103));
__VLS_105.slots.default;
const __VLS_106 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_107 = __VLS_asFunctionalComponent(__VLS_106, new __VLS_106({
    modelValue: (__VLS_ctx.addForm.phone),
    placeholder: "手机号码",
}));
const __VLS_108 = __VLS_107({
    modelValue: (__VLS_ctx.addForm.phone),
    placeholder: "手机号码",
}, ...__VLS_functionalComponentArgsRest(__VLS_107));
var __VLS_105;
const __VLS_110 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_111 = __VLS_asFunctionalComponent(__VLS_110, new __VLS_110({
    label: "角色",
    prop: "role",
}));
const __VLS_112 = __VLS_111({
    label: "角色",
    prop: "role",
}, ...__VLS_functionalComponentArgsRest(__VLS_111));
__VLS_113.slots.default;
const __VLS_114 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_115 = __VLS_asFunctionalComponent(__VLS_114, new __VLS_114({
    modelValue: (__VLS_ctx.addForm.role),
    ...{ style: {} },
}));
const __VLS_116 = __VLS_115({
    modelValue: (__VLS_ctx.addForm.role),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_115));
__VLS_117.slots.default;
const __VLS_118 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_119 = __VLS_asFunctionalComponent(__VLS_118, new __VLS_118({
    label: "普通用户",
    value: "user",
}));
const __VLS_120 = __VLS_119({
    label: "普通用户",
    value: "user",
}, ...__VLS_functionalComponentArgsRest(__VLS_119));
const __VLS_122 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_123 = __VLS_asFunctionalComponent(__VLS_122, new __VLS_122({
    label: "管理员",
    value: "admin",
}));
const __VLS_124 = __VLS_123({
    label: "管理员",
    value: "admin",
}, ...__VLS_functionalComponentArgsRest(__VLS_123));
var __VLS_117;
var __VLS_113;
var __VLS_75;
{
    const { footer: __VLS_thisSlot } = __VLS_71.slots;
    const __VLS_126 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_127 = __VLS_asFunctionalComponent(__VLS_126, new __VLS_126({
        ...{ 'onClick': {} },
    }));
    const __VLS_128 = __VLS_127({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_127));
    let __VLS_130;
    let __VLS_131;
    let __VLS_132;
    const __VLS_133 = {
        onClick: (...[$event]) => {
            __VLS_ctx.addDialogVisible = false;
        }
    };
    __VLS_129.slots.default;
    var __VLS_129;
    const __VLS_134 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_135 = __VLS_asFunctionalComponent(__VLS_134, new __VLS_134({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.adding),
    }));
    const __VLS_136 = __VLS_135({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.adding),
    }, ...__VLS_functionalComponentArgsRest(__VLS_135));
    let __VLS_138;
    let __VLS_139;
    let __VLS_140;
    const __VLS_141 = {
        onClick: (__VLS_ctx.handleAdd)
    };
    __VLS_137.slots.default;
    var __VLS_137;
}
var __VLS_71;
const __VLS_142 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_143 = __VLS_asFunctionalComponent(__VLS_142, new __VLS_142({
    modelValue: (__VLS_ctx.resetDialogVisible),
    title: "重置密码",
    width: "440px",
}));
const __VLS_144 = __VLS_143({
    modelValue: (__VLS_ctx.resetDialogVisible),
    title: "重置密码",
    width: "440px",
}, ...__VLS_functionalComponentArgsRest(__VLS_143));
__VLS_145.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "reset-hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.currentUser?.username);
const __VLS_146 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_147 = __VLS_asFunctionalComponent(__VLS_146, new __VLS_146({
    model: (__VLS_ctx.resetForm),
    rules: (__VLS_ctx.resetRules),
    ref: "resetFormRef",
    labelWidth: "80px",
}));
const __VLS_148 = __VLS_147({
    model: (__VLS_ctx.resetForm),
    rules: (__VLS_ctx.resetRules),
    ref: "resetFormRef",
    labelWidth: "80px",
}, ...__VLS_functionalComponentArgsRest(__VLS_147));
/** @type {typeof __VLS_ctx.resetFormRef} */ ;
var __VLS_150 = {};
__VLS_149.slots.default;
const __VLS_152 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
    label: "新密码",
    prop: "new_password",
}));
const __VLS_154 = __VLS_153({
    label: "新密码",
    prop: "new_password",
}, ...__VLS_functionalComponentArgsRest(__VLS_153));
__VLS_155.slots.default;
const __VLS_156 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
    modelValue: (__VLS_ctx.resetForm.new_password),
    type: "password",
    placeholder: "至少8位，含字母和数字",
    showPassword: true,
}));
const __VLS_158 = __VLS_157({
    modelValue: (__VLS_ctx.resetForm.new_password),
    type: "password",
    placeholder: "至少8位，含字母和数字",
    showPassword: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_157));
var __VLS_155;
var __VLS_149;
{
    const { footer: __VLS_thisSlot } = __VLS_145.slots;
    const __VLS_160 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_161 = __VLS_asFunctionalComponent(__VLS_160, new __VLS_160({
        ...{ 'onClick': {} },
    }));
    const __VLS_162 = __VLS_161({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_161));
    let __VLS_164;
    let __VLS_165;
    let __VLS_166;
    const __VLS_167 = {
        onClick: (...[$event]) => {
            __VLS_ctx.resetDialogVisible = false;
        }
    };
    __VLS_163.slots.default;
    var __VLS_163;
    const __VLS_168 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.resetting),
    }));
    const __VLS_170 = __VLS_169({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.resetting),
    }, ...__VLS_functionalComponentArgsRest(__VLS_169));
    let __VLS_172;
    let __VLS_173;
    let __VLS_174;
    const __VLS_175 = {
        onClick: (__VLS_ctx.handleReset)
    };
    __VLS_171.slots.default;
    var __VLS_171;
}
var __VLS_145;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['user-management']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['page-title']} */ ;
/** @type {__VLS_StyleScopedClasses['user-table-card']} */ ;
/** @type {__VLS_StyleScopedClasses['reset-hint']} */ ;
// @ts-ignore
var __VLS_77 = __VLS_76, __VLS_151 = __VLS_150;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Plus: Plus,
            MainLayout: MainLayout,
            loading: loading,
            adding: adding,
            resetting: resetting,
            users: users,
            addDialogVisible: addDialogVisible,
            resetDialogVisible: resetDialogVisible,
            currentUser: currentUser,
            addFormRef: addFormRef,
            resetFormRef: resetFormRef,
            addForm: addForm,
            resetForm: resetForm,
            addRules: addRules,
            resetRules: resetRules,
            formatDate: formatDate,
            openAddDialog: openAddDialog,
            openResetDialog: openResetDialog,
            handleAdd: handleAdd,
            handleReset: handleReset,
            handleDelete: handleDelete,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
