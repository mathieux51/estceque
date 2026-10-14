import { Mail } from 'lucide-react'
import { BLANDINE, CONTACT_EMAIL } from '@/lib/site'
import SocialLinks from './SocialLinks'

/** "Votre interlocutrice": Blandine Schmidt, with contact and profiles. */
export default function ContactPerson() {
  return (
    <section aria-labelledby='interlocutrice' className='card space-y-4'>
      <h2 id='interlocutrice' className='section-title'>
        Votre interlocutrice
      </h2>
      <p className='text-xl text-white'>
        {BLANDINE.name}, {BLANDINE.role}
      </p>
      <ul className='list-disc space-y-1 pl-5'>
        {BLANDINE.credentials.map((credential) => (
          <li key={credential}>{credential}</li>
        ))}
      </ul>
      <a className='btn-primary' href={`mailto:${CONTACT_EMAIL}`}>
        <Mail className='h-4 w-4' aria-hidden='true' />
        Contacter
      </a>
      <div className='space-y-2 pt-2'>
        <p className='text-sm'>
          Suivre Blandine Schmidt sur les réseaux sociaux
        </p>
        <SocialLinks
          label='Réseaux sociaux de Blandine Schmidt'
          links={[
            { name: 'LinkedIn', url: BLANDINE.linkedin },
            { name: 'Facebook', url: BLANDINE.facebook },
            { name: 'Instagram', url: BLANDINE.instagram },
          ]}
        />
      </div>
    </section>
  )
}
