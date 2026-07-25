import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { DataLine, HomeFilled, TrendCharts, Document as DocumentIcon } from '@element-plus/icons-vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import AppNavBar from '@/components/AppNavBar.vue';
import { projectsApi } from '@/api/projects';
const route = useRoute();
const tabs = ref([]);
function resolveIcon(iconName) {
    return ElementPlusIconsVue[iconName] || DocumentIcon;
}
function isActive(path) {
    return route.path === path;
}
async function fetchProjects() {
    try {
        const data = await projectsApi.getProjects();
        tabs.value = data
            .filter(p => p.is_active)
            .sort((a, b) => a.sort_order - b.sort_order);
    }
    catch { /* API fails silently, user can retry */ }
}
onMounted(() => { fetchProjects(); });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "workbench-layout" },
});
/** @type {[typeof AppNavBar, typeof AppNavBar, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(AppNavBar, new AppNavBar({
    brandName: "IQAir 工作台",
    height: (56),
}));
const __VLS_1 = __VLS_0({
    brandName: "IQAir 工作台",
    height: (56),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_2.slots.default;
{
    const { left: __VLS_thisSlot } = __VLS_2.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.$router.push('/dashboard');
            } },
        ...{ class: "brand-area" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "logo" },
    });
    const __VLS_3 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
        size: "24",
    }));
    const __VLS_5 = __VLS_4({
        size: "24",
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
    __VLS_6.slots.default;
    const __VLS_7 = {}.DataLine;
    /** @type {[typeof __VLS_components.DataLine, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({}));
    const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
    var __VLS_6;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "brand-name" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "brand-divider" },
    });
}
{
    const { center: __VLS_thisSlot } = __VLS_2.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
        ...{ class: "tab-bar" },
    });
    for (const [tab] of __VLS_getVForSourceType((__VLS_ctx.tabs))) {
        const __VLS_11 = {}.RouterLink;
        /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
            key: (tab.id),
            to: (tab.route),
            ...{ class: "tab-item" },
            ...{ class: ({ active: __VLS_ctx.isActive(tab.route) }) },
        }));
        const __VLS_13 = __VLS_12({
            key: (tab.id),
            to: (tab.route),
            ...{ class: "tab-item" },
            ...{ class: ({ active: __VLS_ctx.isActive(tab.route) }) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_12));
        __VLS_14.slots.default;
        const __VLS_15 = {}.ElIcon;
        /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
            size: "16",
        }));
        const __VLS_17 = __VLS_16({
            size: "16",
        }, ...__VLS_functionalComponentArgsRest(__VLS_16));
        __VLS_18.slots.default;
        const __VLS_19 = ((__VLS_ctx.resolveIcon(tab.icon)));
        // @ts-ignore
        const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({}));
        const __VLS_21 = __VLS_20({}, ...__VLS_functionalComponentArgsRest(__VLS_20));
        var __VLS_18;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "tab-label" },
        });
        (tab.name);
        var __VLS_14;
    }
}
{
    const { right: __VLS_thisSlot } = __VLS_2.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        href: "/bi/",
        target: "_blank",
        ...{ class: "back-nav-link" },
    });
    const __VLS_23 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
        size: "14",
    }));
    const __VLS_25 = __VLS_24({
        size: "14",
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
    __VLS_26.slots.default;
    const __VLS_27 = {}.TrendCharts;
    /** @type {[typeof __VLS_components.TrendCharts, ]} */ ;
    // @ts-ignore
    const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({}));
    const __VLS_29 = __VLS_28({}, ...__VLS_functionalComponentArgsRest(__VLS_28));
    var __VLS_26;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    const __VLS_31 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent(__VLS_31, new __VLS_31({
        to: "/",
        ...{ class: "back-nav-link" },
    }));
    const __VLS_33 = __VLS_32({
        to: "/",
        ...{ class: "back-nav-link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
    __VLS_34.slots.default;
    const __VLS_35 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
        size: "14",
    }));
    const __VLS_37 = __VLS_36({
        size: "14",
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    __VLS_38.slots.default;
    const __VLS_39 = {}.HomeFilled;
    /** @type {[typeof __VLS_components.HomeFilled, ]} */ ;
    // @ts-ignore
    const __VLS_40 = __VLS_asFunctionalComponent(__VLS_39, new __VLS_39({}));
    const __VLS_41 = __VLS_40({}, ...__VLS_functionalComponentArgsRest(__VLS_40));
    var __VLS_38;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    var __VLS_34;
}
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "main-content" },
});
const __VLS_43 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({}));
const __VLS_45 = __VLS_44({}, ...__VLS_functionalComponentArgsRest(__VLS_44));
{
    const { default: __VLS_thisSlot } = __VLS_46.slots;
    const [{ Component }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_47 = {}.transition;
    /** @type {[typeof __VLS_components.Transition, typeof __VLS_components.transition, typeof __VLS_components.Transition, typeof __VLS_components.transition, ]} */ ;
    // @ts-ignore
    const __VLS_48 = __VLS_asFunctionalComponent(__VLS_47, new __VLS_47({
        name: "page-fade",
        mode: "out-in",
    }));
    const __VLS_49 = __VLS_48({
        name: "page-fade",
        mode: "out-in",
    }, ...__VLS_functionalComponentArgsRest(__VLS_48));
    __VLS_50.slots.default;
    const __VLS_51 = ((Component));
    // @ts-ignore
    const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({}));
    const __VLS_53 = __VLS_52({}, ...__VLS_functionalComponentArgsRest(__VLS_52));
    var __VLS_50;
    __VLS_46.slots['' /* empty slot name completion */];
}
var __VLS_46;
/** @type {__VLS_StyleScopedClasses['workbench-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-area']} */ ;
/** @type {__VLS_StyleScopedClasses['logo']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-name']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-divider']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-label']} */ ;
/** @type {__VLS_StyleScopedClasses['back-nav-link']} */ ;
/** @type {__VLS_StyleScopedClasses['back-nav-link']} */ ;
/** @type {__VLS_StyleScopedClasses['main-content']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            DataLine: DataLine,
            HomeFilled: HomeFilled,
            TrendCharts: TrendCharts,
            AppNavBar: AppNavBar,
            tabs: tabs,
            resolveIcon: resolveIcon,
            isActive: isActive,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
