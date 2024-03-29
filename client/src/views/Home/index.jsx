import { useParams } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import {useAuth} from '../../hook/useAuth'
import ReactMarkdown from 'react-markdown';
import getCaretCoordinates from 'textarea-caret'
import io from 'socket.io-client';
import remarkGfm from 'remark-gfm'
import {useNavigate} from 'react-router-dom'
import UserCursor from '../../component/UserCursor';
import { useView } from '../../hook/useView';
import { BsSave2Fill} from "react-icons/bs";
import {RiLogoutBoxFill} from "react-icons/ri";
import { jsPDF } from "jspdf";
import api from '../../services/api';
import './styles.scss'

function Home(){
    const params = useParams();
    const code = params.id
    const {user,setUser} = useAuth()
    const [text,setText]= useState('')
    const {users} = useView()
    const textRef = useRef()
    const pdfRef = useRef()
    const navigate = useNavigate()
    //changing document
    const changeText = (e)=>{
        const socket = io.connect('http://localhost:4000');
        socket.emit('change_document',{
                id:code,
                body:e
            })
        setText(e)
        return ()=> socket.disconnect()
    }

    // change cursor position
    useEffect(()=>{
        textRef.current.addEventListener('keyup', e => {
            var caret = getCaretCoordinates(e.target, e.target.selectionEnd);
            const socket = io.connect('http://localhost:4000');
            socket.emit('change_cursor',{
                name:user.name,
                room:code,
                position:`${caret.left},${caret.top}`,
            })
          })
    },[])

    //geting document changes
    useEffect(()=>{
            const socket = io.connect('http://localhost:4000');
            const timer = setInterval(()=>{
                socket.emit('document',{
                    id:code 
                })
                socket.on('document',data =>{
                   return setText(data.body)
                })
            },1000 * 2)
            return ()=> {
                clearInterval(timer)
            }
        },[])
  
    const saveAsPdf=()=>{
        const content = pdfRef.current;

        const doc = new jsPDF('p','pt','a4');
        doc.html(content, {
            callback: function (doc) {
                doc.save('sample.pdf');
            }
        })
    }

    const logOut = async ()=>{
        await api.logout(code,user?.name)
        setUser([])
        navigate(`/`)
        window.location.reload()
        
    }
    const setBarOption=()=>{}
    if(user.name !== null){
    return(
       <div className="page">
           <div className="header">
               <div className='username'>
                   <button><RiLogoutBoxFill onClick={logOut}/></button>
                    <p>Olá, {user.name}</p>
               </div>
               <div className='room_view'>
                    <span>
                        View:
                        {users? users.length : ''}
                    </span>
               </div>
               <div className="code">
                   <p>Código:</p>
                   <span>{code}</span>
               </div>
           </div>
           <div className="editor">
               <div className="editor_container">
                <div className="text-area">
                {users ? 
                                users.map(item=>{
                                  if(item.name !== user.name){
                                    const [x,y]= item.cursor_position.split(',')
                                    const left = Number(x)
                                    const top = Number(y) +15
                                     return (
                                         <UserCursor
                                         top={top}
                                         left={left}
                                         name={item.name}
                                         id={item._id}
                                         />
                                     )
                                  }
                                })
                                :''
                            }
                    <div className="toolbar">
                        <ul>
                            <li><button><BsSave2Fill color={'#fff'} className='save' data-element='bold'
                            onClick={saveAsPdf}
                            /></button></li>
                        </ul>
                    </div>
                    <div className='text'>
                        <div className='text-wrp'>
                        <textarea 
                        id='text'
                        name="text-area"
                        ref={textRef}
                        className='lined-area'
                        autoFocus
                        value={text}
                        onChange={(e)=>{changeText(e.target.value)}}
                        >
                        </textarea>
                        </div>
                    </div>
                </div>
                <div className="preview" id='pdf' ref={pdfRef}>
                    <ReactMarkdown children={text} className='text'
                    remarkPlugins={[remarkGfm]}
                    />
                </div>
               </div>
           </div>
       </div>
    )        
    }
    else{
        return(<></>)
    }
}
export default Home