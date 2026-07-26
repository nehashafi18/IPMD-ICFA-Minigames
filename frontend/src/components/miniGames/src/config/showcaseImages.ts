// Centralized showcase image configuration for the transition page.
//
// These are the ONLY images displayed in the transition gallery.
// Place artwork in  frontend/public/new-showcase/  as 01.jpg … 17.jpg
//
// Images that fail to load are silently skipped.
// If none load, TransitionScreen shows a neutral loading state — no old artwork.

export interface ShowcaseImage {
  src: string;
  caption: string;
}

export const SHOWCASE_IMAGES: ShowcaseImage[] = [
  { src: '/new-showcase/01.jpg', caption: 'Blooming Imagination' },
  { src: '/new-showcase/02.jpg', caption: 'Colorful Childhood'   },
  { src: '/new-showcase/03.jpg', caption: "Nature's Canvas"      },
  { src: '/new-showcase/04.jpg', caption: 'Dreams in Color'      },
  { src: '/new-showcase/05.jpg', caption: 'Abstract Emotions'    },
  { src: '/new-showcase/06.jpg', caption: 'Paper Garden'         },
  { src: '/new-showcase/07.jpg', caption: 'Collage Story'        },
  { src: '/new-showcase/08.jpg', caption: 'Digital Harmony'      },
  { src: '/new-showcase/09.jpg', caption: 'Layered Memories'     },
  { src: '/new-showcase/10.jpg', caption: 'Bold Expression'      },
  { src: '/new-showcase/11.jpg', caption: 'Tender Moments'       },
  { src: '/new-showcase/12.jpg', caption: 'Forest Journey'       },
  { src: '/new-showcase/13.jpg', caption: 'Mosaic Life'          },
  { src: '/new-showcase/14.jpg', caption: 'Starlit Creation'     },
  { src: '/new-showcase/15.jpg', caption: 'Golden Hour'          },
  { src: '/new-showcase/16.jpg', caption: 'Hidden Worlds'        },
  { src: '/new-showcase/17.jpg', caption: 'Ancient Patterns'     },
];
