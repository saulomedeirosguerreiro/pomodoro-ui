import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../lib/language'
import { SegmentedControl } from './SegmentedControl'

export function LanguageSwitcher() {
  const { t } = useTranslation('common')
  const { language, setLanguage } = useLanguage()

  const options = SUPPORTED_LANGUAGES.map((value) => ({
    value,
    label: t(`language.${value}`),
  }))

  return (
    <SegmentedControl<SupportedLanguage>
      options={options}
      value={language}
      onChange={setLanguage}
      ariaLabel={t('language.switcherLabel')}
    />
  )
}
