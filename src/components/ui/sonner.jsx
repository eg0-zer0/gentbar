import { useTheme } from "../../contexts/ThemeContext";
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme } = useTheme();
  const sonnerTheme = theme === 'gentbar' ? 'dark' : theme;

  return (
    <Sonner
      theme={sonnerTheme}
      position="top-center"
      duration={2200}
      visibleToasts={2}
      className="toaster group"
      toastOptions={{
        duration: 2200,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border-color group-[.toaster]:shadow-md group-[.toaster]:py-2 group-[.toaster]:px-3.5 group-[.toaster]:text-xs group-[.toaster]:rounded-lg",
          title: "text-xs font-medium text-foreground",
          description: "text-xs text-muted-text",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground text-xs",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground text-xs",
        },
      }}
      {...props} />
  );
};

export { Toaster };
