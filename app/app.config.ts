export default defineAppConfig({
    ui: {
        colors: {
            primary: 'emerald',
            neutral: 'zinc',
        },

        button: {
            compoundVariants: [
                {
                    color: 'neutral',
                    variant: 'solid',
                    class: 'bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-200 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:bg-zinc-900 hover:dark:bg-zinc-800 active:dark:bg-zinc-800 dark:text-zinc-200'
                }
            ]
        }
    }
})
