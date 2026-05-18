import Link from 'next/link'

const FOOTER_LINKS = ['Privacy', 'Terms', 'Advertising', 'Ad Choices', 'Cookies', 'More'] as const
const LANGUAGES    = ['English (US)', 'Filipino', 'Español', 'Français', 'Deutsch', 'Italiano', 'Português'] as const

interface AuthFooterProps { showLanguages?: boolean }

export const AuthFooter = ({ showLanguages = false }: AuthFooterProps) => (
  <footer className="w-full max-w-5xl mx-auto px-4 mt-6 pb-6 text-[#8a8d91]">
    {showLanguages && (
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-[13px]">
        {LANGUAGES.map((lang, i) => (
          <button key={lang} className={`hover:underline transition-colors ${i === 0 ? 'font-semibold text-[#1c1e21]' : ''}`}>
            {lang}
          </button>
        ))}
        <button className="hover:underline">+</button>
      </div>
    )}
    <div className="border-t border-[#dddfe2] pt-3">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
        {FOOTER_LINKS.map(link => (
          <Link key={link} href="#" className="hover:underline transition-colors">{link}</Link>
        ))}
        <span>Meta © {new Date().getFullYear()}</span>
      </div>
    </div>
  </footer>
)

interface FieldErrorProps { message?: string }

export const FieldError = ({ message }: FieldErrorProps) =>
  message ? <p className="text-red-500 text-[12px] mt-1 px-1">{message}</p> : null
