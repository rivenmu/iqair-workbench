import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, ArrowDown, ArrowRight, User, UserFilled, SwitchButton, Link, Edit, Delete, Download, FolderOpened, Star, Monitor, Tools, MagicStick, Setting } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import RivenLogo from '@/components/RivenLogo.vue';
import { navigationApi } from '@/api/navigation';
import { useUserStore } from '@/stores/user';
const router = useRouter();
const userStore = useUserStore();
const categories = [
    { key: 'favorites', label: '我的收藏', icon: Star },
    { key: 'work_sites', label: '工作站点', icon: Monitor },
    { key: 'personal_sites', label: '个人站点', icon: User },
    { key: 'tools', label: '实用工具', icon: Tools },
    { key: 'ai_tools', label: 'AI工具', icon: MagicStick },
];
const categoryOptions = [
    { value: 'work_sites', label: '工作站点' },
    { value: 'personal_sites', label: '个人站点' },
    { value: 'tools', label: '实用工具' },
    { value: 'ai_tools', label: 'AI工具' },
];
const sectionData = reactive({});
const sectionLoading = reactive({});
const activeSection = ref('work_sites');
const scrollContainer = ref(null);
const sectionRefs = {};
let scrollTicking = false;
const showDialog = ref(false);
const editingLink = ref(null);
const submitting = ref(false);
const iconPreview = ref('');
const iconFile = ref(null);
const linkForm = reactive({
    name: '',
    url: '',
    description: '',
    category: 'work_sites',
    is_internal: false,
    is_active: true,
    icon_emoji: '',
    sort_order: 0,
});
function setSectionRef(key, el) {
    sectionRefs[key] = el;
}
function scrollToSection(key) {
    const el = sectionRefs[key];
    if (el && scrollContainer.value) {
        const top = el.offsetTop - 16;
        scrollContainer.value.scrollTo({ top, behavior: 'smooth' });
    }
    activeSection.value = key;
}
function handleScroll() {
    if (!scrollTicking) {
        requestAnimationFrame(() => {
            const container = scrollContainer.value;
            if (container) {
                const scrollTop = container.scrollTop + 60;
                for (const cat of categories) {
                    const el = sectionRefs[cat.key];
                    if (el) {
                        const top = el.offsetTop;
                        const bottom = top + el.offsetHeight;
                        if (scrollTop >= top && scrollTop < bottom) {
                            activeSection.value = cat.key;
                            break;
                        }
                    }
                }
            }
            scrollTicking = false;
        });
        scrollTicking = true;
    }
}
async function fetchAllSections() {
    const promises = categories.map(cat => fetchSectionData(cat.key));
    await Promise.all(promises);
}
async function fetchSectionData(key) {
    sectionLoading[key] = true;
    try {
        let data;
        if (key === 'favorites') {
            if (userStore.isLoggedIn) {
                data = await navigationApi.getFavorites();
            }
            else {
                sectionData[key] = [];
                return;
            }
        }
        else {
            data = await navigationApi.getLinks({ category: key });
        }
        sectionData[key] = Array.isArray(data) ? data : [];
        if (key === 'work_sites') {
            sectionData[key].unshift({
                id: 'ciyun-link',
                name: '词云图',
                description: '用户评价词云分析',
                url: '/ciyun',
                is_internal: true,
                is_active: true,
                icon_emoji: '☁️',
                is_favorited: false,
            });
        }
    }
    catch {
        sectionData[key] = [];
        if (key === 'work_sites') {
            sectionData[key] = [{
                    id: 'ciyun-link',
                    name: '词云图',
                    description: '用户评价词云分析',
                    url: '/ciyun',
                    is_internal: true,
                    is_active: true,
                    icon_emoji: '☁️',
                    is_favorited: false,
                }];
        }
    }
    finally {
        sectionLoading[key] = false;
    }
}
function handleCardClick(link) {
    if (link.is_internal) {
        if (!userStore.isLoggedIn) {
            ElMessage.info('请先登录');
            router.push({ name: 'Login', query: { redirect: link.url } });
            return;
        }
        router.push(link.url);
    }
    else {
        window.open(link.url, '_blank');
    }
    // 首次点击无图标的链接时自动抓取favicon
    if (!link.is_internal && !link.icon_image && !link.icon_emoji && !link._iconFetching) {
        link._iconFetching = true;
        navigationApi.fetchIcon(link.id).then((res) => {
            if (res.success && res.link?.icon_image) {
                link.icon_image = res.link.icon_image;
            }
        }).catch(() => {
            // 抓取失败静默处理
        }).finally(() => {
            link._iconFetching = false;
        });
    }
}
async function handleFavorite(link, sectionKey) {
    if (!userStore.isLoggedIn) {
        router.push({ name: 'Login', query: { redirect: '/' } });
        return;
    }
    try {
        const res = await navigationApi.toggleFavorite(link.id);
        link.is_favorited = res.is_favorited;
        if (sectionKey === 'favorites' && !res.is_favorited) {
            sectionData.favorites = sectionData.favorites.filter(l => l.id !== link.id);
        }
    }
    catch {
        // 错误已在拦截器处理
    }
}
function openAddDialog(category) {
    editingLink.value = null;
    linkForm.name = '';
    linkForm.url = '';
    linkForm.description = '';
    linkForm.category = category && category !== 'favorites' ? category : 'work_sites';
    linkForm.is_internal = false;
    linkForm.is_active = true;
    linkForm.icon_emoji = '';
    linkForm.sort_order = 0;
    iconPreview.value = '';
    iconFile.value = null;
    showDialog.value = true;
}
function openEditDialog(link) {
    editingLink.value = link;
    linkForm.name = link.name;
    linkForm.url = link.url;
    linkForm.description = link.description || '';
    linkForm.category = link.category;
    linkForm.is_internal = link.is_internal;
    linkForm.icon_emoji = link.icon_emoji || '';
    linkForm.sort_order = link.sort_order || 0;
    linkForm.is_active = link.is_active !== false;
    iconPreview.value = link.icon_image || '';
    iconFile.value = null;
    showDialog.value = true;
}
function handleIconUpload(file) {
    iconFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        iconPreview.value = e.target?.result;
    };
    reader.readAsDataURL(file);
    return false;
}
async function handleSubmit() {
    if (!linkForm.name || !linkForm.url) {
        ElMessage.warning('请填写名称和链接地址');
        return;
    }
    submitting.value = true;
    try {
        const formData = new FormData();
        formData.append('name', linkForm.name);
        formData.append('url', linkForm.url);
        formData.append('description', linkForm.description);
        formData.append('category', linkForm.category);
        formData.append('is_internal', String(linkForm.is_internal));
        formData.append('is_active', String(linkForm.is_active));
        formData.append('icon_emoji', linkForm.icon_emoji);
        formData.append('sort_order', String(linkForm.sort_order));
        if (iconFile.value) {
            formData.append('icon_image', iconFile.value);
        }
        if (editingLink.value) {
            await navigationApi.updateLink(editingLink.value.id, formData);
            ElMessage.success('链接更新成功');
        }
        else {
            await navigationApi.createLink(formData);
            ElMessage.success('链接添加成功');
        }
        showDialog.value = false;
        fetchSectionData(linkForm.category);
        if (userStore.isLoggedIn) {
            fetchSectionData('favorites');
        }
    }
    catch {
        // 错误已在拦截器处理
    }
    finally {
        submitting.value = false;
    }
}
async function handleDelete(link, sectionKey) {
    try {
        await ElMessageBox.confirm(`确定要删除"${link.name}"吗？`, '提示', {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning',
        });
        await navigationApi.deleteLink(link.id);
        ElMessage.success('删除成功');
        sectionData[sectionKey] = sectionData[sectionKey].filter(l => l.id !== link.id);
    }
    catch {
        // 用户取消
    }
}
async function handleFetchIcon(link) {
    try {
        ElMessage.info(`正在抓取 ${link.name} 的图标...`);
        const res = await navigationApi.fetchIcon(link.id);
        if (res.success && res.link?.icon_image) {
            link.icon_image = res.link.icon_image;
            ElMessage.success('图标抓取成功');
        }
        else {
            ElMessage.warning(res.message || '未找到图标');
        }
    }
    catch {
        ElMessage.error('图标抓取失败');
    }
}
function handleCommand(command) {
    switch (command) {
        case 'profile':
            router.push('/profile');
            break;
        case 'users':
            router.push('/users');
            break;
        case 'admin':
            window.open(`/api/auth/admin-sso/?token=${userStore.token}`, '_blank');
            break;
        case 'logout':
            ElMessageBox.confirm('确定要退出登录吗？', '提示', {
                confirmButtonText: '退出',
                cancelButtonText: '取消',
                type: 'warning',
            }).then(() => {
                userStore.logout();
                router.push('/');
            }).catch(() => { });
            break;
    }
}
onMounted(async () => {
    await fetchAllSections();
    await nextTick();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-count']} */ ;
/** @type {__VLS_StyleScopedClasses['link-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['heart-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['link-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-admin']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-label']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-count']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
/** @type {__VLS_StyleScopedClasses['content-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['links-grid']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "nav-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "top-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "top-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "top-left" },
});
/** @type {[typeof RivenLogo, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(RivenLogo, new RivenLogo({
    ...{ 'onClick': {} },
    clickable: true,
}));
const __VLS_1 = __VLS_0({
    ...{ 'onClick': {} },
    clickable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onClick: (...[$event]) => {
        __VLS_ctx.scrollToSection('work_sites');
    }
};
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "top-right" },
});
if (!__VLS_ctx.userStore.isLoggedIn) {
    const __VLS_7 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
        ...{ 'onClick': {} },
        type: "primary",
        round: true,
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onClick': {} },
        type: "primary",
        round: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_11;
    let __VLS_12;
    let __VLS_13;
    const __VLS_14 = {
        onClick: (...[$event]) => {
            if (!(!__VLS_ctx.userStore.isLoggedIn))
                return;
            __VLS_ctx.router.push('/login');
        }
    };
    __VLS_10.slots.default;
    const __VLS_15 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({}));
    const __VLS_17 = __VLS_16({}, ...__VLS_functionalComponentArgsRest(__VLS_16));
    __VLS_18.slots.default;
    const __VLS_19 = {}.User;
    /** @type {[typeof __VLS_components.User, ]} */ ;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({}));
    const __VLS_21 = __VLS_20({}, ...__VLS_functionalComponentArgsRest(__VLS_20));
    var __VLS_18;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    var __VLS_10;
}
else {
    const __VLS_23 = {}.ElDropdown;
    /** @type {[typeof __VLS_components.ElDropdown, typeof __VLS_components.elDropdown, typeof __VLS_components.ElDropdown, typeof __VLS_components.elDropdown, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
        ...{ 'onCommand': {} },
        trigger: "click",
    }));
    const __VLS_25 = __VLS_24({
        ...{ 'onCommand': {} },
        trigger: "click",
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    let __VLS_27;
    let __VLS_28;
    let __VLS_29;
    const __VLS_30 = {
        onCommand: (__VLS_ctx.handleCommand)
    };
    __VLS_26.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "user-avatar" },
    });
    const __VLS_31 = {}.ElAvatar;
    /** @type {[typeof __VLS_components.ElAvatar, typeof __VLS_components.elAvatar, typeof __VLS_components.ElAvatar, typeof __VLS_components.elAvatar, ]} */ ;
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
        size: (32),
        ...{ class: "avatar-circle" },
    }));
    const __VLS_33 = __VLS_32({
        size: (32),
        ...{ class: "avatar-circle" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    __VLS_34.slots.default;
    (__VLS_ctx.userStore.username.charAt(0).toUpperCase());
    var __VLS_34;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "username" },
    });
    (__VLS_ctx.userStore.username);
    const __VLS_35 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({}));
    const __VLS_37 = __VLS_36({}, ...__VLS_functionalComponentArgsRest(__VLS_36));
    __VLS_38.slots.default;
    const __VLS_39 = {}.ArrowDown;
    /** @type {[typeof __VLS_components.ArrowDown, ]} */ ;
    // @ts-ignore
    const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({}));
    const __VLS_41 = __VLS_40({}, ...__VLS_functionalComponentArgsRest(__VLS_40));
    var __VLS_38;
    {
        const { dropdown: __VLS_thisSlot } = __VLS_26.slots;
        const __VLS_43 = {}.ElDropdownMenu;
        /** @type {[typeof __VLS_components.ElDropdownMenu, typeof __VLS_components.elDropdownMenu, typeof __VLS_components.ElDropdownMenu, typeof __VLS_components.elDropdownMenu, ]} */ ;
        // @ts-ignore
        const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({}));
        const __VLS_45 = __VLS_44({}, ...__VLS_functionalComponentArgsRest(__VLS_44));
        __VLS_46.slots.default;
        const __VLS_47 = {}.ElDropdownItem;
        /** @type {[typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, ]} */ ;
        // @ts-ignore
        const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
            command: "profile",
        }));
        const __VLS_49 = __VLS_48({
            command: "profile",
        }, ...__VLS_functionalComponentArgsRest(__VLS_48));
        __VLS_50.slots.default;
        const __VLS_51 = {}.ElIcon;
        /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
        // @ts-ignore
        const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({}));
        const __VLS_53 = __VLS_52({}, ...__VLS_functionalComponentArgsRest(__VLS_52));
        __VLS_54.slots.default;
        const __VLS_55 = {}.User;
        /** @type {[typeof __VLS_components.User, ]} */ ;
        // @ts-ignore
        const __VLS_56 = __VLS_asFunctionalComponent(__VLS_55, new __VLS_55({}));
        const __VLS_57 = __VLS_56({}, ...__VLS_functionalComponentArgsRest(__VLS_56));
        var __VLS_54;
        var __VLS_50;
        if (__VLS_ctx.userStore.isAdmin) {
            const __VLS_59 = {}.ElDropdownItem;
            /** @type {[typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, ]} */ ;
            // @ts-ignore
            const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
                command: "users",
            }));
            const __VLS_61 = __VLS_60({
                command: "users",
            }, ...__VLS_functionalComponentArgsRest(__VLS_60));
            __VLS_62.slots.default;
            const __VLS_63 = {}.ElIcon;
            /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
            // @ts-ignore
            const __VLS_64 = __VLS_asFunctionalComponent(__VLS_63, new __VLS_63({}));
            const __VLS_65 = __VLS_64({}, ...__VLS_functionalComponentArgsRest(__VLS_64));
            __VLS_66.slots.default;
            const __VLS_67 = {}.UserFilled;
            /** @type {[typeof __VLS_components.UserFilled, ]} */ ;
            // @ts-ignore
            const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({}));
            const __VLS_69 = __VLS_68({}, ...__VLS_functionalComponentArgsRest(__VLS_68));
            var __VLS_66;
            var __VLS_62;
        }
        if (__VLS_ctx.userStore.isAdmin) {
            const __VLS_71 = {}.ElDropdownItem;
            /** @type {[typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, ]} */ ;
            // @ts-ignore
            const __VLS_72 = __VLS_asFunctionalComponent(__VLS_71, new __VLS_71({
                command: "admin",
            }));
            const __VLS_73 = __VLS_72({
                command: "admin",
            }, ...__VLS_functionalComponentArgsRest(__VLS_72));
            __VLS_74.slots.default;
            const __VLS_75 = {}.ElIcon;
            /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
            // @ts-ignore
            const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({}));
            const __VLS_77 = __VLS_76({}, ...__VLS_functionalComponentArgsRest(__VLS_76));
            __VLS_78.slots.default;
            const __VLS_79 = {}.Setting;
            /** @type {[typeof __VLS_components.Setting, ]} */ ;
            // @ts-ignore
            const __VLS_80 = __VLS_asFunctionalComponent(__VLS_79, new __VLS_79({}));
            const __VLS_81 = __VLS_80({}, ...__VLS_functionalComponentArgsRest(__VLS_80));
            var __VLS_78;
            var __VLS_74;
        }
        const __VLS_83 = {}.ElDropdownItem;
        /** @type {[typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, typeof __VLS_components.ElDropdownItem, typeof __VLS_components.elDropdownItem, ]} */ ;
        // @ts-ignore
        const __VLS_84 = __VLS_asFunctionalComponent(__VLS_83, new __VLS_83({
            command: "logout",
            divided: true,
        }));
        const __VLS_85 = __VLS_84({
            command: "logout",
            divided: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_84));
        __VLS_86.slots.default;
        const __VLS_87 = {}.ElIcon;
        /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
        // @ts-ignore
        const __VLS_88 = __VLS_asFunctionalComponent(__VLS_87, new __VLS_87({}));
        const __VLS_89 = __VLS_88({}, ...__VLS_functionalComponentArgsRest(__VLS_88));
        __VLS_90.slots.default;
        const __VLS_91 = {}.SwitchButton;
        /** @type {[typeof __VLS_components.SwitchButton, ]} */ ;
        // @ts-ignore
        const __VLS_92 = __VLS_asFunctionalComponent(__VLS_91, new __VLS_91({}));
        const __VLS_93 = __VLS_92({}, ...__VLS_functionalComponentArgsRest(__VLS_92));
        var __VLS_90;
        var __VLS_86;
        var __VLS_46;
    }
    var __VLS_26;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "body-area" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "sidebar-nav" },
});
for (const [cat] of __VLS_getVForSourceType((__VLS_ctx.categories))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.scrollToSection(cat.key);
            } },
        key: (cat.key),
        ...{ class: "sidebar-item" },
        ...{ class: ({ active: __VLS_ctx.activeSection === cat.key }) },
    });
    const __VLS_95 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_96 = __VLS_asFunctionalComponent(__VLS_95, new __VLS_95({
        size: "18",
    }));
    const __VLS_97 = __VLS_96({
        size: "18",
    }, ...__VLS_functionalComponentArgsRest(__VLS_96));
    __VLS_98.slots.default;
    const __VLS_99 = ((cat.icon));
    // @ts-ignore
    const __VLS_100 = __VLS_asFunctionalComponent(__VLS_99, new __VLS_99({}));
    const __VLS_101 = __VLS_100({}, ...__VLS_functionalComponentArgsRest(__VLS_100));
    var __VLS_98;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "sidebar-label" },
    });
    (cat.label);
    if (__VLS_ctx.sectionData[cat.key]) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "sidebar-count" },
        });
        (__VLS_ctx.sectionData[cat.key].length);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ onScroll: (__VLS_ctx.handleScroll) },
    ...{ class: "scroll-content" },
    ref: "scrollContainer",
});
/** @type {typeof __VLS_ctx.scrollContainer} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "content-wrapper" },
});
for (const [cat] of __VLS_getVForSourceType((__VLS_ctx.categories))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        key: (cat.key),
        id: (`section-${cat.key}`),
        ...{ class: "category-section" },
        ref: (el => __VLS_ctx.setSectionRef(cat.key, el)),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-title-area" },
    });
    const __VLS_103 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_104 = __VLS_asFunctionalComponent(__VLS_103, new __VLS_103({
        size: "22",
        color: "#007AFF",
    }));
    const __VLS_105 = __VLS_104({
        size: "22",
        color: "#007AFF",
    }, ...__VLS_functionalComponentArgsRest(__VLS_104));
    __VLS_106.slots.default;
    const __VLS_107 = ((cat.icon));
    // @ts-ignore
    const __VLS_108 = __VLS_asFunctionalComponent(__VLS_107, new __VLS_107({}));
    const __VLS_109 = __VLS_108({}, ...__VLS_functionalComponentArgsRest(__VLS_108));
    var __VLS_106;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "section-title" },
    });
    (cat.label);
    if (__VLS_ctx.userStore.isAdmin && cat.key !== 'favorites') {
        const __VLS_111 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_112 = __VLS_asFunctionalComponent(__VLS_111, new __VLS_111({
            ...{ 'onClick': {} },
            type: "primary",
            icon: (__VLS_ctx.Plus),
            round: true,
            size: "small",
        }));
        const __VLS_113 = __VLS_112({
            ...{ 'onClick': {} },
            type: "primary",
            icon: (__VLS_ctx.Plus),
            round: true,
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_112));
        let __VLS_115;
        let __VLS_116;
        let __VLS_117;
        const __VLS_118 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.userStore.isAdmin && cat.key !== 'favorites'))
                    return;
                __VLS_ctx.openAddDialog(cat.key);
            }
        };
        __VLS_114.slots.default;
        var __VLS_114;
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "links-grid" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.sectionLoading[cat.key]) }, null, null);
    for (const [link, index] of __VLS_getVForSourceType(((__VLS_ctx.sectionData[cat.key] || [])))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.handleCardClick(link);
                } },
            key: (link.id),
            ...{ class: "link-card" },
            ...{ style: ({ '--i': index }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-icon-area" },
        });
        if (link.icon_image) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                src: (link.icon_image),
                alt: (link.name),
                ...{ class: "card-icon-img" },
            });
        }
        else if (link.icon_emoji) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "card-icon-emoji" },
            });
            (link.icon_emoji);
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "card-icon-default" },
            });
            const __VLS_119 = {}.ElIcon;
            /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
            // @ts-ignore
            const __VLS_120 = __VLS_asFunctionalComponent(__VLS_119, new __VLS_119({
                size: "24",
                color: "#86868B",
            }));
            const __VLS_121 = __VLS_120({
                size: "24",
                color: "#86868B",
            }, ...__VLS_functionalComponentArgsRest(__VLS_120));
            __VLS_122.slots.default;
            const __VLS_123 = {}.Link;
            /** @type {[typeof __VLS_components.Link, ]} */ ;
            // @ts-ignore
            const __VLS_124 = __VLS_asFunctionalComponent(__VLS_123, new __VLS_123({}));
            const __VLS_125 = __VLS_124({}, ...__VLS_functionalComponentArgsRest(__VLS_124));
            var __VLS_122;
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-body" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: "card-title" },
        });
        (link.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "card-desc" },
        });
        (link.description || '暂无描述');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-footer" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "card-url" },
        });
        (link.is_internal ? '内部' : link.url);
        const __VLS_127 = {}.ElIcon;
        /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
        // @ts-ignore
        const __VLS_128 = __VLS_asFunctionalComponent(__VLS_127, new __VLS_127({
            ...{ class: "card-arrow" },
        }));
        const __VLS_129 = __VLS_128({
            ...{ class: "card-arrow" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_128));
        __VLS_130.slots.default;
        const __VLS_131 = {}.ArrowRight;
        /** @type {[typeof __VLS_components.ArrowRight, ]} */ ;
        // @ts-ignore
        const __VLS_132 = __VLS_asFunctionalComponent(__VLS_131, new __VLS_131({}));
        const __VLS_133 = __VLS_132({}, ...__VLS_functionalComponentArgsRest(__VLS_132));
        var __VLS_130;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.handleFavorite(link, cat.key);
                } },
            ...{ class: "heart-btn" },
            ...{ class: ({ favorited: link.is_favorited }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            ...{ class: "heart-icon" },
            fill: (link.is_favorited ? '#FF3B30' : 'none'),
            stroke: (link.is_favorited ? '#FF3B30' : '#AEAEB2'),
            'stroke-width': "2",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
        });
        if (__VLS_ctx.userStore.isAdmin && cat.key !== 'favorites') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "card-admin" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.userStore.isAdmin && cat.key !== 'favorites'))
                            return;
                        __VLS_ctx.handleFetchIcon(link);
                    } },
                ...{ class: "admin-btn fetch-btn" },
                title: "抓取图标",
            });
            const __VLS_135 = {}.ElIcon;
            /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
            // @ts-ignore
            const __VLS_136 = __VLS_asFunctionalComponent(__VLS_135, new __VLS_135({
                size: "14",
            }));
            const __VLS_137 = __VLS_136({
                size: "14",
            }, ...__VLS_functionalComponentArgsRest(__VLS_136));
            __VLS_138.slots.default;
            const __VLS_139 = {}.Download;
            /** @type {[typeof __VLS_components.Download, ]} */ ;
            // @ts-ignore
            const __VLS_140 = __VLS_asFunctionalComponent(__VLS_139, new __VLS_139({}));
            const __VLS_141 = __VLS_140({}, ...__VLS_functionalComponentArgsRest(__VLS_140));
            var __VLS_138;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.userStore.isAdmin && cat.key !== 'favorites'))
                            return;
                        __VLS_ctx.openEditDialog(link);
                    } },
                ...{ class: "admin-btn edit-btn" },
            });
            const __VLS_143 = {}.ElIcon;
            /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
            // @ts-ignore
            const __VLS_144 = __VLS_asFunctionalComponent(__VLS_143, new __VLS_143({
                size: "14",
            }));
            const __VLS_145 = __VLS_144({
                size: "14",
            }, ...__VLS_functionalComponentArgsRest(__VLS_144));
            __VLS_146.slots.default;
            const __VLS_147 = {}.Edit;
            /** @type {[typeof __VLS_components.Edit, ]} */ ;
            // @ts-ignore
            const __VLS_148 = __VLS_asFunctionalComponent(__VLS_147, new __VLS_147({}));
            const __VLS_149 = __VLS_148({}, ...__VLS_functionalComponentArgsRest(__VLS_148));
            var __VLS_146;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.userStore.isAdmin && cat.key !== 'favorites'))
                            return;
                        __VLS_ctx.handleDelete(link, cat.key);
                    } },
                ...{ class: "admin-btn delete-btn" },
            });
            const __VLS_151 = {}.ElIcon;
            /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
            // @ts-ignore
            const __VLS_152 = __VLS_asFunctionalComponent(__VLS_151, new __VLS_151({
                size: "14",
            }));
            const __VLS_153 = __VLS_152({
                size: "14",
            }, ...__VLS_functionalComponentArgsRest(__VLS_152));
            __VLS_154.slots.default;
            const __VLS_155 = {}.Delete;
            /** @type {[typeof __VLS_components.Delete, ]} */ ;
            // @ts-ignore
            const __VLS_156 = __VLS_asFunctionalComponent(__VLS_155, new __VLS_155({}));
            const __VLS_157 = __VLS_156({}, ...__VLS_functionalComponentArgsRest(__VLS_156));
            var __VLS_154;
        }
    }
    if (!__VLS_ctx.sectionLoading[cat.key] && (!__VLS_ctx.sectionData[cat.key] || __VLS_ctx.sectionData[cat.key].length === 0)) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-state" },
        });
        const __VLS_159 = {}.ElIcon;
        /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
        // @ts-ignore
        const __VLS_160 = __VLS_asFunctionalComponent(__VLS_159, new __VLS_159({
            size: "40",
            color: "#D2D2D7",
        }));
        const __VLS_161 = __VLS_160({
            size: "40",
            color: "#D2D2D7",
        }, ...__VLS_functionalComponentArgsRest(__VLS_160));
        __VLS_162.slots.default;
        const __VLS_163 = {}.FolderOpened;
        /** @type {[typeof __VLS_components.FolderOpened, ]} */ ;
        // @ts-ignore
        const __VLS_164 = __VLS_asFunctionalComponent(__VLS_163, new __VLS_163({}));
        const __VLS_165 = __VLS_164({}, ...__VLS_functionalComponentArgsRest(__VLS_164));
        var __VLS_162;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "empty-text" },
        });
        (cat.key === 'favorites' ? '还没有收藏任何链接，点击红心收藏吧' : '暂无链接');
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bottom-spacer" },
});
const __VLS_167 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_168 = __VLS_asFunctionalComponent(__VLS_167, new __VLS_167({
    modelValue: (__VLS_ctx.showDialog),
    title: (__VLS_ctx.editingLink ? '编辑链接' : '添加链接'),
    width: "520px",
}));
const __VLS_169 = __VLS_168({
    modelValue: (__VLS_ctx.showDialog),
    title: (__VLS_ctx.editingLink ? '编辑链接' : '添加链接'),
    width: "520px",
}, ...__VLS_functionalComponentArgsRest(__VLS_168));
__VLS_170.slots.default;
const __VLS_171 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_172 = __VLS_asFunctionalComponent(__VLS_171, new __VLS_171({
    model: (__VLS_ctx.linkForm),
    labelWidth: "90px",
}));
const __VLS_173 = __VLS_172({
    model: (__VLS_ctx.linkForm),
    labelWidth: "90px",
}, ...__VLS_functionalComponentArgsRest(__VLS_172));
__VLS_174.slots.default;
const __VLS_175 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_176 = __VLS_asFunctionalComponent(__VLS_175, new __VLS_175({
    label: "名称",
}));
const __VLS_177 = __VLS_176({
    label: "名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_176));
__VLS_178.slots.default;
const __VLS_179 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_180 = __VLS_asFunctionalComponent(__VLS_179, new __VLS_179({
    modelValue: (__VLS_ctx.linkForm.name),
    placeholder: "网站名称",
}));
const __VLS_181 = __VLS_180({
    modelValue: (__VLS_ctx.linkForm.name),
    placeholder: "网站名称",
}, ...__VLS_functionalComponentArgsRest(__VLS_180));
var __VLS_178;
const __VLS_183 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_184 = __VLS_asFunctionalComponent(__VLS_183, new __VLS_183({
    label: "链接地址",
}));
const __VLS_185 = __VLS_184({
    label: "链接地址",
}, ...__VLS_functionalComponentArgsRest(__VLS_184));
__VLS_186.slots.default;
const __VLS_187 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_188 = __VLS_asFunctionalComponent(__VLS_187, new __VLS_187({
    modelValue: (__VLS_ctx.linkForm.url),
    placeholder: "https://example.com 或 /dashboard/xxx",
}));
const __VLS_189 = __VLS_188({
    modelValue: (__VLS_ctx.linkForm.url),
    placeholder: "https://example.com 或 /dashboard/xxx",
}, ...__VLS_functionalComponentArgsRest(__VLS_188));
var __VLS_186;
const __VLS_191 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_192 = __VLS_asFunctionalComponent(__VLS_191, new __VLS_191({
    label: "描述",
}));
const __VLS_193 = __VLS_192({
    label: "描述",
}, ...__VLS_functionalComponentArgsRest(__VLS_192));
__VLS_194.slots.default;
const __VLS_195 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_196 = __VLS_asFunctionalComponent(__VLS_195, new __VLS_195({
    modelValue: (__VLS_ctx.linkForm.description),
    type: "textarea",
    rows: (2),
    placeholder: "网站描述（选填）",
}));
const __VLS_197 = __VLS_196({
    modelValue: (__VLS_ctx.linkForm.description),
    type: "textarea",
    rows: (2),
    placeholder: "网站描述（选填）",
}, ...__VLS_functionalComponentArgsRest(__VLS_196));
var __VLS_194;
const __VLS_199 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_200 = __VLS_asFunctionalComponent(__VLS_199, new __VLS_199({
    label: "分类",
}));
const __VLS_201 = __VLS_200({
    label: "分类",
}, ...__VLS_functionalComponentArgsRest(__VLS_200));
__VLS_202.slots.default;
const __VLS_203 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_204 = __VLS_asFunctionalComponent(__VLS_203, new __VLS_203({
    modelValue: (__VLS_ctx.linkForm.category),
    ...{ style: {} },
}));
const __VLS_205 = __VLS_204({
    modelValue: (__VLS_ctx.linkForm.category),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_204));
__VLS_206.slots.default;
for (const [cat] of __VLS_getVForSourceType((__VLS_ctx.categoryOptions))) {
    const __VLS_207 = {}.ElOption;
    /** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
    // @ts-ignore
    const __VLS_208 = __VLS_asFunctionalComponent(__VLS_207, new __VLS_207({
        key: (cat.value),
        label: (cat.label),
        value: (cat.value),
    }));
    const __VLS_209 = __VLS_208({
        key: (cat.value),
        label: (cat.label),
        value: (cat.value),
    }, ...__VLS_functionalComponentArgsRest(__VLS_208));
}
var __VLS_206;
var __VLS_202;
const __VLS_211 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_212 = __VLS_asFunctionalComponent(__VLS_211, new __VLS_211({
    label: "内部链接",
}));
const __VLS_213 = __VLS_212({
    label: "内部链接",
}, ...__VLS_functionalComponentArgsRest(__VLS_212));
__VLS_214.slots.default;
const __VLS_215 = {}.ElSwitch;
/** @type {[typeof __VLS_components.ElSwitch, typeof __VLS_components.elSwitch, ]} */ ;
// @ts-ignore
const __VLS_216 = __VLS_asFunctionalComponent(__VLS_215, new __VLS_215({
    modelValue: (__VLS_ctx.linkForm.is_internal),
}));
const __VLS_217 = __VLS_216({
    modelValue: (__VLS_ctx.linkForm.is_internal),
}, ...__VLS_functionalComponentArgsRest(__VLS_216));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "form-hint" },
});
var __VLS_214;
const __VLS_219 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_220 = __VLS_asFunctionalComponent(__VLS_219, new __VLS_219({
    label: "启用",
}));
const __VLS_221 = __VLS_220({
    label: "启用",
}, ...__VLS_functionalComponentArgsRest(__VLS_220));
__VLS_222.slots.default;
const __VLS_223 = {}.ElSwitch;
/** @type {[typeof __VLS_components.ElSwitch, typeof __VLS_components.elSwitch, ]} */ ;
// @ts-ignore
const __VLS_224 = __VLS_asFunctionalComponent(__VLS_223, new __VLS_223({
    modelValue: (__VLS_ctx.linkForm.is_active),
}));
const __VLS_225 = __VLS_224({
    modelValue: (__VLS_ctx.linkForm.is_active),
}, ...__VLS_functionalComponentArgsRest(__VLS_224));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "form-hint" },
});
var __VLS_222;
const __VLS_227 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_228 = __VLS_asFunctionalComponent(__VLS_227, new __VLS_227({
    label: "图标图片",
}));
const __VLS_229 = __VLS_228({
    label: "图标图片",
}, ...__VLS_functionalComponentArgsRest(__VLS_228));
__VLS_230.slots.default;
const __VLS_231 = {}.ElUpload;
/** @type {[typeof __VLS_components.ElUpload, typeof __VLS_components.elUpload, typeof __VLS_components.ElUpload, typeof __VLS_components.elUpload, ]} */ ;
// @ts-ignore
const __VLS_232 = __VLS_asFunctionalComponent(__VLS_231, new __VLS_231({
    ...{ class: "icon-uploader" },
    showFileList: (false),
    beforeUpload: (__VLS_ctx.handleIconUpload),
    accept: "image/*",
}));
const __VLS_233 = __VLS_232({
    ...{ class: "icon-uploader" },
    showFileList: (false),
    beforeUpload: (__VLS_ctx.handleIconUpload),
    accept: "image/*",
}, ...__VLS_functionalComponentArgsRest(__VLS_232));
__VLS_234.slots.default;
if (__VLS_ctx.iconPreview) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (__VLS_ctx.iconPreview),
        ...{ class: "icon-preview" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "icon-upload-placeholder" },
    });
    const __VLS_235 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_236 = __VLS_asFunctionalComponent(__VLS_235, new __VLS_235({
        size: "20",
    }));
    const __VLS_237 = __VLS_236({
        size: "20",
    }, ...__VLS_functionalComponentArgsRest(__VLS_236));
    __VLS_238.slots.default;
    const __VLS_239 = {}.Plus;
    /** @type {[typeof __VLS_components.Plus, ]} */ ;
    // @ts-ignore
    const __VLS_240 = __VLS_asFunctionalComponent(__VLS_239, new __VLS_239({}));
    const __VLS_241 = __VLS_240({}, ...__VLS_functionalComponentArgsRest(__VLS_240));
    var __VLS_238;
}
var __VLS_234;
var __VLS_230;
const __VLS_243 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_244 = __VLS_asFunctionalComponent(__VLS_243, new __VLS_243({
    label: "图标Emoji",
}));
const __VLS_245 = __VLS_244({
    label: "图标Emoji",
}, ...__VLS_functionalComponentArgsRest(__VLS_244));
__VLS_246.slots.default;
const __VLS_247 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_248 = __VLS_asFunctionalComponent(__VLS_247, new __VLS_247({
    modelValue: (__VLS_ctx.linkForm.icon_emoji),
    placeholder: "📊（图片图标优先）",
}));
const __VLS_249 = __VLS_248({
    modelValue: (__VLS_ctx.linkForm.icon_emoji),
    placeholder: "📊（图片图标优先）",
}, ...__VLS_functionalComponentArgsRest(__VLS_248));
var __VLS_246;
const __VLS_251 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_252 = __VLS_asFunctionalComponent(__VLS_251, new __VLS_251({
    label: "排序",
}));
const __VLS_253 = __VLS_252({
    label: "排序",
}, ...__VLS_functionalComponentArgsRest(__VLS_252));
__VLS_254.slots.default;
const __VLS_255 = {}.ElInputNumber;
/** @type {[typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ]} */ ;
// @ts-ignore
const __VLS_256 = __VLS_asFunctionalComponent(__VLS_255, new __VLS_255({
    modelValue: (__VLS_ctx.linkForm.sort_order),
    min: (0),
}));
const __VLS_257 = __VLS_256({
    modelValue: (__VLS_ctx.linkForm.sort_order),
    min: (0),
}, ...__VLS_functionalComponentArgsRest(__VLS_256));
var __VLS_254;
var __VLS_174;
{
    const { footer: __VLS_thisSlot } = __VLS_170.slots;
    const __VLS_259 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_260 = __VLS_asFunctionalComponent(__VLS_259, new __VLS_259({
        ...{ 'onClick': {} },
    }));
    const __VLS_261 = __VLS_260({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_260));
    let __VLS_263;
    let __VLS_264;
    let __VLS_265;
    const __VLS_266 = {
        onClick: (...[$event]) => {
            __VLS_ctx.showDialog = false;
        }
    };
    __VLS_262.slots.default;
    var __VLS_262;
    const __VLS_267 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_268 = __VLS_asFunctionalComponent(__VLS_267, new __VLS_267({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.submitting),
    }));
    const __VLS_269 = __VLS_268({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.submitting),
    }, ...__VLS_functionalComponentArgsRest(__VLS_268));
    let __VLS_271;
    let __VLS_272;
    let __VLS_273;
    const __VLS_274 = {
        onClick: (__VLS_ctx.handleSubmit)
    };
    __VLS_270.slots.default;
    (__VLS_ctx.editingLink ? '保存' : '添加');
    var __VLS_270;
}
var __VLS_170;
/** @type {__VLS_StyleScopedClasses['nav-page']} */ ;
/** @type {__VLS_StyleScopedClasses['top-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['top-content']} */ ;
/** @type {__VLS_StyleScopedClasses['top-left']} */ ;
/** @type {__VLS_StyleScopedClasses['top-right']} */ ;
/** @type {__VLS_StyleScopedClasses['user-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar-circle']} */ ;
/** @type {__VLS_StyleScopedClasses['username']} */ ;
/** @type {__VLS_StyleScopedClasses['body-area']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-label']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-count']} */ ;
/** @type {__VLS_StyleScopedClasses['scroll-content']} */ ;
/** @type {__VLS_StyleScopedClasses['content-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['category-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title-area']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['links-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['link-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon-area']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon-img']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon-emoji']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon-default']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['card-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['card-url']} */ ;
/** @type {__VLS_StyleScopedClasses['card-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['heart-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['heart-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-admin']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['fetch-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-text']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-spacer']} */ ;
/** @type {__VLS_StyleScopedClasses['form-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['form-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-uploader']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-upload-placeholder']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Plus: Plus,
            ArrowDown: ArrowDown,
            ArrowRight: ArrowRight,
            User: User,
            UserFilled: UserFilled,
            SwitchButton: SwitchButton,
            Link: Link,
            Edit: Edit,
            Delete: Delete,
            Download: Download,
            FolderOpened: FolderOpened,
            Setting: Setting,
            RivenLogo: RivenLogo,
            router: router,
            userStore: userStore,
            categories: categories,
            categoryOptions: categoryOptions,
            sectionData: sectionData,
            sectionLoading: sectionLoading,
            activeSection: activeSection,
            scrollContainer: scrollContainer,
            showDialog: showDialog,
            editingLink: editingLink,
            submitting: submitting,
            iconPreview: iconPreview,
            linkForm: linkForm,
            setSectionRef: setSectionRef,
            scrollToSection: scrollToSection,
            handleScroll: handleScroll,
            handleCardClick: handleCardClick,
            handleFavorite: handleFavorite,
            openAddDialog: openAddDialog,
            openEditDialog: openEditDialog,
            handleIconUpload: handleIconUpload,
            handleSubmit: handleSubmit,
            handleDelete: handleDelete,
            handleFetchIcon: handleFetchIcon,
            handleCommand: handleCommand,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
