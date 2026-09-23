import { useEffect,useState } from "react";
import { Film,Plus,Star,Trash2,X } from "lucide-react";
import { COLORS } from "../../constants/theme";
import { supabase } from "../../services/supabase";
import EntertainmentProgressSection from "./EntertainmentProgressSection";

const empty={title:"",item_type:"livro",status:"quero_consumir",consumed_by:"isabela",genre:"",author_director:"",platform:"",total_pages:"",current_page:0,total_seasons:"",current_season:0,current_episode:0,rating:"",review:"",notes:"",is_favorite:false};
const TYPES={livro:"Livro",filme:"Filme",serie:"Série"},STATUS={quero_consumir:"Quero ver/ler",em_andamento:"Em andamento",concluido:"Concluído",pausado:"Pausado",abandonado:"Abandonado"},PEOPLE={isabela:"Isabela",eduardo:"Eduardo",os_dois:"Os dois"};
async function userId(name){let r=await supabase.from("users").select("id").eq("display_name",name).maybeSingle();if(!r.data&&!r.error)r=await supabase.from("users").select("id").eq("name",name).maybeSingle();if(r.error)throw r.error;return r.data?.id;}
export default function EntertainmentPage({currentUser}){const[id,setId]=useState(null),[items,setItems]=useState([]),[form,setForm]=useState(empty),[show,setShow]=useState(false),[error,setError]=useState("");useEffect(()=>{load()},[currentUser]);async function load(){try{const uid=await userId(currentUser);setId(uid);const{data,error:e}=await supabase.from("entertainment_items").select("*").is("deleted_at",null).order("created_at",{ascending:false});if(e)throw e;setItems(data||[])}catch(e){setError(e.message)}}async function save(event){event.preventDefault();if(!form.title.trim())return setError("Informe o título.");const payload={...form,created_by_user_id:id,total_pages:form.total_pages?Number(form.total_pages):null,current_page:Number(form.current_page||0),total_seasons:form.total_seasons?Number(form.total_seasons):null,current_season:Number(form.current_season||0),current_episode:Number(form.current_episode||0),rating:form.rating?Number(form.rating):null,completed_at:form.status==="concluido"?new Date().toISOString().slice(0,10):null};const{error:e}=await supabase.from("entertainment_items").insert(payload);if(e)return setError(e.message);setForm(empty);setShow(false);load()}async function remove(item){if(!confirm(`Mover “${item.title}” para a Lixeira?`))return;const{error:e}=await supabase.from("entertainment_items").update({deleted_at:new Date().toISOString(),deleted_by:id}).eq("id",item.id);if(e)setError(e.message);else setItems(v=>v.filter(x=>x.id!==item.id))}return <div style={{display:"grid",gap:14}}><section style={panel}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}><div>
  <h2
    style={{
      margin: 0,
      color: COLORS.ink,
      display: "flex",
      alignItems: "center",
      gap: 7,
      fontSize: 19,
      letterSpacing: "-0.3px",
    }}
  >
  <Film size={19} color={COLORS.primaryDark} /> Entretenimento</h2><small style={{color:COLORS.inkSoft}}>Livros, filmes e séries de vocês.</small></div><button onClick={()=>setShow(true)} style={button}><Plus size={15}/> Novo item</button></div></section>{show&&<form onSubmit={save} style={{...panel,background:COLORS.bg}}><div style={grid}><Field l="Título *"><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} style={input}/></Field><Field l="Tipo"><select value={form.item_type} onChange={e=>setForm({...form,item_type:e.target.value})} style={input}>{Object.entries(TYPES).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field><Field l="Status"><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={input}>{Object.entries(STATUS).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field><Field l="Quem"><select value={form.consumed_by} onChange={e=>setForm({...form,consumed_by:e.target.value})} style={input}>{Object.entries(PEOPLE).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field><Field l="Gênero"><input value={form.genre} onChange={e=>setForm({...form,genre:e.target.value})} style={input}/></Field><Field l="Autor/Diretor"><input value={form.author_director} onChange={e=>setForm({...form,author_director:e.target.value})} style={input}/></Field><Field l="Plataforma"><input value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})} style={input}/></Field>
{form.item_type === "livro" && (
  <>
    <Field l="Total de páginas">
      <input
        type="number"
        min="1"
        value={form.total_pages}
        onChange={(e) =>
          setForm({
            ...form,
            total_pages: e.target.value,
          })
        }
        style={input}
      />
    </Field>

    <Field l="Página atual">
      <input
        type="number"
        min="0"
        value={form.current_page}
        onChange={(e) =>
          setForm({
            ...form,
            current_page: e.target.value,
          })
        }
        style={input}
      />
    </Field>
  </>
)}

{form.item_type === "serie" && (
  <>
    <Field l="Total de temporadas">
      <input
        type="number"
        min="1"
        value={form.total_seasons}
        onChange={(e) =>
          setForm({
            ...form,
            total_seasons: e.target.value,
          })
        }
        style={input}
      />
    </Field>

    <Field l="Temporada atual">
      <input
        type="number"
        min="0"
        value={form.current_season}
        onChange={(e) =>
          setForm({
            ...form,
            current_season: e.target.value,
          })
        }
        style={input}
      />
    </Field>

    <Field l="Episódio atual">
      <input
        type="number"
        min="0"
        value={form.current_episode}
        onChange={(e) =>
          setForm({
            ...form,
            current_episode: e.target.value,
          })
        }
        style={input}
      />
    </Field>
  </>
)}
<Field l="Nota (0 a 5)"><input type="number" min="0" max="5" step="0.5" value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})} style={input}/></Field></div><Field l="Resenha/observações"><textarea value={form.review} onChange={e=>setForm({...form,review:e.target.value})} style={input}/></Field><label style={{fontSize:12}}><input type="checkbox" checked={form.is_favorite} onChange={e=>setForm({...form,is_favorite:e.target.checked})}/> Favorito</label><div style={{display:"flex",gap:7,marginTop:10}}><button style={button}>Salvar</button><button type="button" onClick={()=>setShow(false)} style={icon}><X/></button></div></form>}{error&&<div style={{color:COLORS.danger}}>{error}</div>}
<EntertainmentProgressSection
  currentUser={currentUser}
  items={items}
  onChange={load}
/>
<section style={panel}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,240px),1fr))",gap:10}}>{items.map(item=><article key={item.id} style={{border:`1px solid ${COLORS.border}`,borderRadius:10,padding:11}}><div style={{display:"flex",justifyContent:"space-between"}}><strong style={{color:COLORS.ink}}>{item.title}</strong>{item.is_favorite&&<Star size={15} fill="currentColor" color={COLORS.warning}/>}</div><small style={{color:COLORS.inkSoft}}>{TYPES[item.item_type]} • {STATUS[item.status]} • {PEOPLE[item.consumed_by]}</small><div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}><button onClick={()=>remove(item)} style={{...icon,color:COLORS.danger}}><Trash2 size={15}/></button></div></article>)}</div></section></div>}
function Field({l,children}){return <label style={{display:"grid",gap:4,color:COLORS.inkSoft,fontSize:11}}>{l}{children}</label>};
  const panel = {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 14,
  };
  const grid = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
    gap: 9,
    marginBottom: 10,
  };

  const input = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: "8px 9px",
    background: COLORS.surface,
    color: COLORS.ink,
    font: "inherit",
  };

  const button = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    border: 0,
    borderRadius: 9,
    padding: "8px 11px",
    background: COLORS.primary,
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  };

  const icon = {
    width: 30,
    height: 30,
    display: "grid",
    placeItems: "center",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    background: COLORS.surface,
    color: COLORS.primaryDark,
    cursor: "pointer",
  };
