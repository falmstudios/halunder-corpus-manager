# upload_texts.py
import json
import os
from supabase import create_client, Client
import re
from typing import List, Dict, Any
from tqdm import tqdm
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'upload_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

# Initialize Supabase client
url = "YOUR_SUPABASE_URL"
key = "YOUR_SUPABASE_ANON_KEY"

try:
    supabase: Client = create_client(url, key)
    # Test connection
    supabase.table('documents').select("*").limit(1).execute()
    logging.info("Successfully connected to Supabase")
except Exception as e:
    logging.error(f"Failed to connect to Supabase: {str(e)}")
    raise

def split_into_sentences(text: str) -> List[str]:
    """Split text into sentences for Helgolandic/German text."""
    if not text:
        return []
    
    # Handle Helgolandic sentence endings
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
    return [s.strip() for s in sentences if s.strip()]

def import_json_file(filepath: str):
    """Import a single JSON file into the database."""
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Insert document metadata
        doc_meta = data.get('documentMetadata', {})
        document = {
            'filename': os.path.basename(filepath),
            'publication': doc_meta.get('publication'),
            'year': doc_meta.get('year'),
            'month': doc_meta.get('month'),
            'edition': doc_meta.get('edition'),
            'issue_number': doc_meta.get('issueNumber'),
            'page_numbers': doc_meta.get('pageNumbers'),
            'halunder_sentence_count': doc_meta.get('halunderSentenceCount')
        }
        
        # Insert document
        doc_result = supabase.table('documents').insert(document).execute()
        
        if doc_result.data:
            document_id = doc_result.data[0]['id']
            logging.info(f"Inserted document: {document_id}")
        else:
            raise Exception("Failed to insert document")
        
        # Process each Helgolandic text
        for idx, hel_text in enumerate(data.get('helgolandicTexts', [])):
            header = hel_text.get('headerInformation', {})
            
            # Insert text with bucket status
            text_data = {
                'document_id': document_id,
                'title': header.get('title'),
                'subtitle': header.get('subtitle'),
                'author': header.get('author'),
                'translator': header.get('translator'),
                'editor_corrector': header.get('editorCorrector'),
                'series_info': header.get('seriesInfo'),
                'translation_available': header.get('translationAvailable', False),
                'text_quality': header.get('textQuality'),
                'editorial_introduction': hel_text.get('editorialIntroduction'),
                'position_in_document': idx,
                'helgolandic_text': hel_text.get('completeHelgolandicText', ''),
                'german_text': hel_text.get('germanTranslation', {}).get('fullText', ''),
                'bucket_status': 'unreviewed',  # Default status
                'uebersetzungshilfen': json.dumps(hel_text.get('uebersetzungshilfen', [])),
                'page_break_notes': json.dumps(hel_text.get('pageBreakNotes', []))
            }
            
            text_result = supabase.table('texts').insert(text_data).execute()
            
            if text_result.data:
                text_id = text_result.data[0]['id']
                logging.info(f"Inserted text: {header.get('title', 'Untitled')}")
            else:
                logging.error(f"Failed to insert text: {header.get('title', 'Untitled')}")
                
        return True
        
    except json.JSONDecodeError as e:
        logging.error(f"Invalid JSON in {filepath}: {str(e)}")
        return False
    except Exception as e:
        logging.error(f"Error processing {filepath}: {str(e)}")
        return False

def import_all_json_files(directory: str):
    """Import all JSON files from a directory with progress bar."""
    json_files = [f for f in os.listdir(directory) if f.endswith('.json')]
    
    if not json_files:
        logging.warning(f"No JSON files found in {directory}")
        return
    
    success_count = 0
    
    with tqdm(total=len(json_files), desc="Importing files") as pbar:
        for filename in json_files:
            filepath = os.path.join(directory, filename)
            pbar.set_description(f"Processing {filename[:30]}...")
            
            if import_json_file(filepath):
                success_count += 1
            
            pbar.update(1)
    
    logging.info(f"Successfully imported {success_count}/{len(json_files)} files")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        directory = sys.argv[1]
    else:
        directory = input("Enter the directory path containing JSON files: ")
    
    import_all_json_files(directory)
