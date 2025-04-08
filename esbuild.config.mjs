import * as esbuild from 'esbuild';

var isBuild = process.argv.includes('--build') || process.argv.includes('-b');

export async function build() {
    let minify = true

    const entryPoints = [
        './src/**/*.ts',
    ]

    const settings = {
        entryPoints: entryPoints,
        bundle: true,
        outdir: './dist',
        format: 'iife',
        platform: 'browser',
        minify: minify,
    };

    let ctx = await esbuild.context(settings);

    if (isBuild) {
        try{
            console.log('Starting build process...');
            await esbuild.build(settings);

        } catch (err) {
            throw err;

        } finally {
            if (ctx) {
                await ctx.dispose();
            }
        }
    } else {
        await ctx.watch()
        console.log('watching...');
    }
}

function main() {
    if (isBuild) {
        build()
            .catch((err) => {
                console.error('An error occurred in the build process:', err);
                process.exit(1);
            })
            .finally(() => {
                console.log('Build Complete');
            });

    } else {
        build()
            .catch((err) => {
                console.error('An error occurred in the build process:', err);
                process.exit(1);
            })
    }
}

main();
