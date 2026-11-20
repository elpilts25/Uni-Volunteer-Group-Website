import ChatBubbleOutlined from '@mui/icons-material/ChatBubbleOutlined';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import TagOutlined from '@mui/icons-material/Tag';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import WorkOutlined from '@mui/icons-material/WorkOutlined';
import PublicOutlined from '@mui/icons-material/PublicOutlined';
import EventOutlined from '@mui/icons-material/EventOutlined';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';

// Keys are stored in the backend; their labels live under `categoryIcons` in the translation files.
export const categoryIcons = {
    chat: { Icon: ChatBubbleOutlined },
    home: { Icon: HomeOutlined },
    tag: { Icon: TagOutlined },
    people: { Icon: PeopleOutlined },
    work: { Icon: WorkOutlined },
    public: { Icon: PublicOutlined },
    event: { Icon: EventOutlined },
    school: { Icon: SchoolOutlined },
};

export const getCategoryIcon = (key) => (categoryIcons[key] ?? categoryIcons.chat).Icon;
