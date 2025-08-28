# knowledgebase.py
import os
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.vectorstores.utils import DistanceStrategy
from langchain_huggingface import HuggingFaceEmbeddings

# ----------------------------
# Paths
# ----------------------------
current_dir = os.path.dirname(os.path.abspath(__file__))
faq_path = os.path.join(current_dir, "FAQ.txt")
upload_dir = os.path.join(current_dir, "uploaded_docs")

os.makedirs(upload_dir, exist_ok=True)

# ----------------------------
# Initialize embeddings
# ----------------------------
embeddings = HuggingFaceEmbeddings(
    model_name="thenlper/gte-small",
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True},
)

def update_knowledge_base():
    """
    Loads all documents from the uploaded_docs directory, splits them into chunks,
    and updates the Chroma vector store.
    """
    documents = []
    if os.path.exists(faq_path):
        faq_loader = TextLoader(faq_path, encoding="utf-8")
        documents.extend(faq_loader.load())

    for file in os.listdir(upload_dir):
        file_path = os.path.join(upload_dir, file)
        if file.endswith(".pdf"):
            pdf_loader = PyPDFLoader(file_path)
            documents.extend(pdf_loader.load())
        elif file.endswith(".txt"):
            text_loader = TextLoader(file_path, encoding="utf-8")
            documents.extend(text_loader.load())

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    document_chunks = text_splitter.split_documents(documents)

    if not document_chunks:
        print("No documents to update in the knowledge base.")
        return

    persist_dir = os.path.join(current_dir, "chroma_db")

    vectorstore = Chroma.from_documents(
        document_chunks,embeddings,DistanceStrategy.COSINE,persist_directory = 'chroma_db'
    )
    print("✅ Knowledgebase updated with FAQ + uploaded documents.")

# Initial update when the application starts
update_knowledge_base()