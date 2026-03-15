export type NavItemModel = {
  label?: string;
  labelKey?: string;
  icon: string;
  routerLink?: string;
  command?: () => void;
  items?: NavItemModel[];
};
