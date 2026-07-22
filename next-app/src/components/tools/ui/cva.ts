/**
 * Minimal cva (class-variance-authority) compatible shim.
 *
 * next-app 未预装 class-variance-authority 且 Phase 1 禁止新增依赖，
 * 这里实现 Tools UI 组件实际用到的子集：
 * - cva(base, { variants, defaultVariants })
 * - 调用时支持传入 variant 值与 className（追加到末尾）
 * - VariantProps<typeof fn> 类型推导
 *
 * 如后续全站统一引入 class-variance-authority，可将 ui/{button,badge,label}.tsx
 * 的导入改回官方包，行为一致。
 */

type VariantValue = string | number | boolean | null | undefined;

type VariantsConfig = Record<string, Record<string, string>>;

interface CvaConfig<V extends VariantsConfig> {
  variants: V;
  defaultVariants?: { [K in keyof V]?: keyof V[K] };
}

type CvaProps<V extends VariantsConfig> = {
  [K in keyof V]?: keyof V[K] | null | undefined;
} & {
  className?: string;
};

export function cva<V extends VariantsConfig = Record<never, never>>(
  base: string,
  config?: CvaConfig<V>,
) {
  return (props?: CvaProps<V>): string => {
    const classes: string[] = [base];
    if (config?.variants && props) {
      for (const key of Object.keys(config.variants) as (keyof V)[]) {
        const value =
          (props[key] ?? config.defaultVariants?.[key]) as VariantValue;
        if (value === null || value === undefined) continue;
        const variantClass = config.variants[key][String(value)];
        if (variantClass) classes.push(variantClass);
      }
    } else if (config?.variants && config.defaultVariants) {
      for (const key of Object.keys(config.variants) as (keyof V)[]) {
        const value = config.defaultVariants[key];
        if (value === undefined) continue;
        const variantClass = config.variants[key][String(value)];
        if (variantClass) classes.push(variantClass);
      }
    }
    if (props?.className) classes.push(props.className);
    return classes.filter(Boolean).join(' ');
  };
}

export type VariantProps<T> =
  T extends (props?: infer P) => string
    ? Omit<NonNullable<P>, 'className'>
    : never;
