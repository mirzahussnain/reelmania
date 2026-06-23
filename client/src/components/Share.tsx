import {  FaRegCopy } from 'react-icons/fa';
import { EmailIcon, EmailShareButton, TwitterIcon, TwitterShareButton, WhatsappIcon, WhatsappShareButton } from 'react-share'; // replace 'some-icon-library' with the actual library name
import { toast } from 'react-toastify';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Button } from '../shared/components/ui/Button';

const BASE_SHARE_URL:string=import.meta.env.VITE_VIDEO_SHARE_BASE_URL
type Props = {
    videoId:string | undefined
}

const Share = ({videoId}: Props) => {
    if(!videoId || !BASE_SHARE_URL){
        toast.error("Video Id or base url is missing");
        return;
    }
    const videoLink=`${BASE_SHARE_URL}/videos/${videoId}`;
  return (
    <div className="w-full h-9 text-on-surface-variant flex justify-start items-center p-3 rounded-xl bg-surface-container">
      
        <EmailShareButton children={<EmailIcon size={30} className='rounded-full mx-2'/>} url={videoLink} />
        
        <CopyToClipboard text={videoLink} onCopy={()=>toast.info("Link copied to clipboard")}>
            <Button variant="unstyled" className='p-2 rounded-full bg-surface-container-high text-on-surface mx-2'>
            <FaRegCopy/>
            </Button>
        </CopyToClipboard>
        <WhatsappShareButton children={<WhatsappIcon size={30} className='rounded-full mx-2 ' />} url={videoLink}  />
        <TwitterShareButton children={ <TwitterIcon  size={30} className='rounded-full mx-2'/>}   url={videoLink}/>
       
    </div>
  )
}

export default Share