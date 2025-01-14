'use client'
const GOOGLEMAPS_KEY = 'AIzaSyBLt_ENVCVtEq6bCyWu9ZgN6gZ-uEf_S_U'
import { useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import Google from '@/components/map/google'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { Location } from '@/types/map'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash } from 'lucide-react'
import { Bolt } from 'lucide-react'

const filters = ['Highways', 'Unpaved Roads', 'Ferries', 'Tunnels', 'uTurns']
const configurations = [
  'Maximum Speed (km)',
  'Weight (kg)',
  'Length (in)',
  'Height (in)'
]

export default function Page() {
  const [addresses, setAddresses] = useState<string[]>([])
  const [newAddress, setNewAddress] = useState<string>('')

  const handleAddAddress = () => {
    if (newAddress.trim() && !addresses.includes(newAddress.trim())) {
      setAddresses([...addresses, newAddress.trim()])
      setNewAddress('')
    }
  }

  const handleRemoveAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index))
  }

  const dummy_location: Location = {
    latitude: 0,
    longitude: 0
  }

  return (
    <div className='relative'>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
            <div className='flex items-center gap-2 px-4'>
              <SidebarTrigger className='-ml-1' />
              <Separator orientation='vertical' className='mr-2 h-4' />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className='hidden md:block'>
                    <BreadcrumbLink href='#'>Create route</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className='flex flex-col lg:flex-row h-[calc(100vh-4rem)]'>
            {/* Left Section: Filters and Route Adding */}
            <div className='w-full lg:w-[30%] flex flex-col gap-4 p-4'>
              <div className='rounded-xl bg-muted/50 p-4'>
                <h1 className='text-xl font-bold'>Create Route</h1>
                <div className='mt-4 flex flex-col sm:flex-row justify-between items-center gap-4'>
                  <Input
                    type='text'
                    className='w-full sm:w-[70%]'
                    placeholder='Enter address or zip code'
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                  />
                  <Button className='px-8 w-full sm:w-auto' onClick={handleAddAddress}>
                    Add
                  </Button>
                </div>
              </div>

              {addresses.length < 1 ? (
                <></>
              ):
              <div className='rounded-xl bg-muted/50 p-4'>
              <h2 className='font-bold text-lg m-2'>Destinations</h2>
              <ul className='space-y-2'>
                {addresses.map((address, index) => (
                  <li
                    key={index}
                    className='flex justify-between items-center bg-muted/50 rounded-md p-2'
                  >
                    <span className='truncate m-2'>{address}</span>
                    <Trash
                      className='cursor-pointer text-red-500'
                      onClick={() => handleRemoveAddress(index)}
                    />
                  </li>
                ))}
              </ul>
              <div className='flex justify-between mt-4'>
                <label className='m-2 font-semibold'>Credits: 15</label>
                <Button><Bolt/> Calculate</Button>
              </div>
            </div>
              }
            

              <div className='rounded-xl bg-muted/50 p-4'>
                <h2 className='text-lg font-semibold'>Filters</h2>
                <div className='grid auto-rows-min gap-2 mt-4'>
                  {filters.map((filter, index) => (
                    <div key={index} className='flex items-center space-x-2'>
                      <Checkbox />
                      <label>{filter}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className='rounded-xl bg-muted/50 p-4'>
                <h2 className='text-lg font-semibold'>Configuration</h2>
                <div className='grid auto-rows-max gap-2 mt-4'>
                  {configurations.map((configuration, index) => (
                    <div key={index} className='flex-col items-center'>
                      <label>{configuration}</label>
                      <Input type='string' className='w-16' />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Section: Map */}
            <div className='w-full lg:w-[70%]'>
              <div className='relative w-full h-full lg:h-full'>
                <Google location={dummy_location} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
