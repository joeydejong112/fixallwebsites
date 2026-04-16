import { defineAsyncComponent } from 'vue'
export const toolComponentMap: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  'security-headers': defineAsyncComponent(() => import('~/pages/tools/security-headers.vue')),
  'csp-builder':      defineAsyncComponent(() => import('~/pages/tools/csp-builder.vue')),
  'image-optimizer':  defineAsyncComponent(() => import('~/pages/tools/image-optimizer.vue')),
  'meta-generator':   defineAsyncComponent(() => import('~/pages/tools/meta-generator.vue')),
  'robots-txt':       defineAsyncComponent(() => import('~/pages/tools/robots-txt.vue')),
  'favicon-generator':defineAsyncComponent(() => import('~/pages/tools/favicon-generator.vue')),
  'schema-generator': defineAsyncComponent(() => import('~/pages/tools/schema-generator.vue')),
  'contrast-checker': defineAsyncComponent(() => import('~/pages/tools/contrast-checker.vue')),
  'email-auth':       defineAsyncComponent(() => import('~/pages/tools/email-auth.vue')),
  'ai-optimizer':     defineAsyncComponent(() => import('~/pages/tools/ai-optimizer.vue')),
}
